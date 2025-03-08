const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fetch = require('node-fetch');
require('dotenv').config();

// Initialize data store
const store = new Store();

// Set the app name
app.name = 'ToDo List';

let mainWindow;

// API key storage functions using electron-store
function storeCanvasApiKey(apiKey) {
  store.set('canvasApiKey', apiKey);
  store.set('hasCompletedFirstLaunch', true); // Mark first launch as complete
}

function getStoredCanvasApiKey() {
  return store.get('canvasApiKey');
}

function hasCompletedFirstLaunch() {
  return store.get('hasCompletedFirstLaunch', false);
}

// Create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: true,
    transparent: false,
    alwaysOnTop: store.get('pinned', false),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Check if this is first launch or if API key doesn't exist
  mainWindow.webContents.on('did-finish-load', async () => {
    const apiKey = await getStoredCanvasApiKey();
    const completedFirstLaunch = hasCompletedFirstLaunch();
    
    if (!completedFirstLaunch || !apiKey) {
      mainWindow.webContents.send('show-canvas-modal');
    }
  });

  // Set window to stay on all workspaces/desktops
  mainWindow.setVisibleOnAllWorkspaces(true);
}

// When Electron is ready
app.whenReady().then(() => {
  createWindow();
  startAutoRefresh();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  clearInterval(refreshInterval);
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers
ipcMain.handle('get-todos', () => {
  return store.get('todos', []);
});

ipcMain.handle('save-todos', (event, todos) => {
  store.set('todos', todos);
  return true;
});

ipcMain.handle('toggle-pin', () => {
  const currentPinned = store.get('pinned', false);
  const newPinned = !currentPinned;
  store.set('pinned', newPinned);
  mainWindow.setAlwaysOnTop(newPinned);
  return newPinned;
});

ipcMain.handle('store-canvas-api-key', async (event, apiKey) => {
  await storeCanvasApiKey(apiKey);
  return true;
});

ipcMain.handle('get-stored-canvas-api-key', async () => {
  return await getStoredCanvasApiKey();
});

ipcMain.handle('fetch-canvas-assignments', async (event, apiKey) => {
  try {
    // Try to use provided key or get stored key
    const storedApiKey = apiKey || await getStoredCanvasApiKey();
    if (!storedApiKey) {
      throw new Error('Canvas API key not found');
    }

    // If a new key was provided, store it
    if (apiKey) {
      await storeCanvasApiKey(apiKey);
    }

    const baseUrl = process.env.CANVAS_API_URL || store.get('canvasApiUrl') || 'https://canvas.uts.edu.au';
    if (!baseUrl) {
      throw new Error('Canvas API URL not configured');
    }

    // Fetch only active courses with enrollments
    const coursesResponse = await fetch(`${baseUrl}/api/v1/courses?enrollment_state=active&enrollment_type=student&state[]=available&include[]=term`, {
      headers: {
        'Authorization': `Bearer ${storedApiKey}`
      }
    });
    
    if (!coursesResponse.ok) {
      if (coursesResponse.status === 401) {
        throw new Error('Invalid API key');
      }
      throw new Error('Failed to fetch courses');
    }

    const courses = await coursesResponse.json();
    
    // Fetch assignments for each course
    const assignmentPromises = courses.map(async (course) => {
      const assignmentsResponse = await fetch(
        `${baseUrl}/api/v1/courses/${course.id}/assignments?` + new URLSearchParams({
          'include[]': ['submission', 'description', 'due_at'],
          'order_by': 'due_at',
          'per_page': '100',
          'needs_grading_count_by_section': 'false',
          'include_locked': 'false'
        }), {
          headers: {
            'Authorization': `Bearer ${storedApiKey}`
          }
        }
      );
      
      if (!assignmentsResponse.ok) {
        return [];
      }

      const assignments = await assignmentsResponse.json();
      const now = new Date();
      
      return assignments
        .filter(assignment => {
          if (!assignment.due_at || !assignment.published || assignment.locked_for_user) {
            return false;
          }

          const dueDate = new Date(assignment.due_at);
          return dueDate > now;
        })
        .map(assignment => {
          const dueDate = new Date(assignment.due_at);
          const diffTime = Math.abs(dueDate - now);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let relativeDue = '';
          if (diffDays === 0) {
            relativeDue = 'Today';
          } else if (diffDays === 1) {
            relativeDue = 'Tomorrow';
          } else if (diffDays < 7) {
            relativeDue = `in ${diffDays}d`;
          } else {
            relativeDue = `in ${Math.floor(diffDays/7)}w`;
          }

          // Check submission status more accurately
          const isSubmitted = assignment.submission && 
                            assignment.submission.workflow_state === 'submitted' &&
                            assignment.submission.submitted_at;

          return {
            id: assignment.id,
            name: assignment.name,
            courseName: course.name,
            courseCode: course.course_code,
            description: assignment.description ? assignment.description.replace(/<[^>]*>/g, '') : '',
            dueDate: dueDate.toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            }),
            relativeDue,
            points: assignment.points_possible,
            submissionTypes: assignment.submission_types.join(', '),
            isSubmitted,
            lockExplanation: assignment.lock_explanation || '',
            htmlUrl: assignment.html_url,
            courseId: course.id,
            termName: course.term ? course.term.name : ''
          };
        });
    });

    const allAssignments = (await Promise.all(assignmentPromises)).flat();
    
    // Group assignments by course and sort by due date within each group
    const groupedAssignments = {};
    allAssignments.forEach(assignment => {
      if (!groupedAssignments[assignment.courseCode]) {
        groupedAssignments[assignment.courseCode] = {
          courseName: assignment.courseName,
          courseCode: assignment.courseCode,
          assignments: []
        };
      }
      groupedAssignments[assignment.courseCode].assignments.push(assignment);
    });

    // Sort assignments within each course by due date
    Object.values(groupedAssignments).forEach(group => {
      group.assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    });

    return groupedAssignments;
  } catch (error) {
    console.error('Error fetching Canvas assignments:', error);
    throw error;
  }
});

ipcMain.handle('open-external-link', async (event, url) => {
  await shell.openExternal(url);
});

// Add auto-refresh functionality
let refreshInterval;

function startAutoRefresh() {
  // Refresh assignments every 5 minutes
  refreshInterval = setInterval(async () => {
    try {
      const apiKey = await getStoredCanvasApiKey();
      if (apiKey) {
        mainWindow.webContents.send('refresh-assignments');
      }
    } catch (error) {
      console.error('Auto-refresh error:', error);
    }
  }, 5 * 60 * 1000);
}
