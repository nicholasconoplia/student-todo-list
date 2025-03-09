const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config();

// Set the app name before anything else
app.name = 'To-Do';
app.setName('To-Do');

// Initialize data store
const store = new Store();

let mainWindow;

// Add this near the top after the requires
const iconPath = path.resolve(__dirname, 'build', 'icon.png');

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

// Add this near the top with other store functions
function clearStoredData() {
  store.clear();
}

// Function to set the dock icon
function setDockIcon() {
  if (process.platform === 'darwin' && fs.existsSync(iconPath)) {
    try {
      app.dock.setIcon(iconPath);
    } catch (error) {
      console.warn('Failed to set dock icon:', error);
    }
  }
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'To-Do',
      submenu: [
        { role: 'about', label: 'About To-Do' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide To-Do' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit To-Do' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Create the browser window
function createWindow() {
  if (process.platform === 'darwin') {
    try {
      if (fs.existsSync(iconPath)) {
        app.dock.setIcon(iconPath);
      }
    } catch (error) {
      console.warn('Failed to set dock icon:', error);
    }
  }

  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: true,
    transparent: false,
    alwaysOnTop: store.get('pinned', false),
    icon: iconPath,
    title: 'To-Do',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Force the window title
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
    mainWindow.setTitle('To-Do');
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');
  mainWindow.setTitle('To-Do');

  // Check if this is first launch or if API key doesn't exist
  mainWindow.webContents.on('did-finish-load', async () => {
    const apiKey = await getStoredCanvasApiKey();
    const completedFirstLaunch = hasCompletedFirstLaunch();
    
    if (!completedFirstLaunch || !apiKey) {
      mainWindow.webContents.send('show-canvas-modal');
    }
    // Ensure icon is set after page load
    setDockIcon();
  });

  // Set window to stay on all workspaces/desktops
  mainWindow.setVisibleOnAllWorkspaces(true);
}

// When Electron is ready
app.whenReady().then(() => {
  createMenu(); // Create the application menu
  createWindow();
  setDockIcon(); // Set icon when app is ready
  startAutoRefresh();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
    setDockIcon(); // Set icon on reactivation
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  stopAutoRefresh();
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

    const baseUrl = process.env.CANVAS_API_URL || store.get('canvasApiUrl') || 'https://canvas.instructure.com';
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
      // First fetch assignments
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
      
      // For each assignment, fetch its submission details
      const assignmentsWithSubmissions = await Promise.all(assignments
        .filter(assignment => {
          if (!assignment.due_at || !assignment.published || assignment.locked_for_user) {
            return false;
          }

          const dueDate = new Date(assignment.due_at);
          return dueDate > now;
        })
        .map(async assignment => {
          // Fetch submission details for this assignment
          const submissionResponse = await fetch(
            `${baseUrl}/api/v1/courses/${course.id}/assignments/${assignment.id}/submissions/self`, {
              headers: {
                'Authorization': `Bearer ${storedApiKey}`
              }
            }
          );

          let submissionData = null;
          if (submissionResponse.ok) {
            submissionData = await submissionResponse.json();
            // Log raw submission data for debugging
            console.log(`Raw submission data for ${assignment.name}:`, submissionData);
          }

          const dueDate = new Date(assignment.due_at);
          const timeSince = (now.getTime() - dueDate.getTime()) / 60000;
          const timeAbs = Math.abs(timeSince);
          let timeText = Math.round(timeAbs) + " min";
          
          if (timeAbs >= 60) {
            const hours = timeAbs / 60;
            if (hours >= 24) {
              const days = hours / 24;
              timeText = Math.round(days) + " day" + (Math.round(days) !== 1 ? "s" : "");
            } else {
              timeText = Math.round(hours) + " hour" + (Math.round(hours) !== 1 ? "s" : "");
            }
          }
          
          const fromNow = timeSince < 0 ? "in " + timeText : timeText + " ago";
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const formattedDate = `${months[dueDate.getMonth()]} ${dueDate.getDate()} at ${dueDate.getHours() > 12 ? dueDate.getHours() - 12 : dueDate.getHours()}:${(dueDate.getMinutes() < 10 ? "0" : "") + dueDate.getMinutes()}${dueDate.getHours() >= 12 ? "pm" : "am"}`;

          // Simplified submission status check focusing on most reliable indicators
          const isSubmitted = Boolean(
            submissionData && (
              // Most reliable indicator is the workflow_state
              submissionData.workflow_state === 'submitted' ||
              submissionData.workflow_state === 'graded' ||
              // For assignments that are marked as complete
              (submissionData.submitted_at && submissionData.attempt > 0)
            )
          );

          // Log submission check details
          console.log(`Submission check for "${assignment.name}":`, {
            hasSubmissionData: !!submissionData,
            workflowState: submissionData?.workflow_state,
            submittedAt: submissionData?.submitted_at,
            attempt: submissionData?.attempt
          });

          return {
            id: assignment.id,
            name: assignment.name,
            points: assignment.points_possible,
            dueDate: formattedDate,
            relativeDue: fromNow,
            htmlUrl: assignment.html_url,
            courseName: course.name,
            courseCode: course.course_code || course.name,
            isSubmitted: isSubmitted
          };
        }));

      return assignmentsWithSubmissions;
    });

    // Wait for all assignment fetches to complete
    const allAssignments = (await Promise.all(assignmentPromises))
      .flat()
      // Sort all assignments by due date first
      .sort((a, b) => {
        const dateA = new Date(a.dueDate.replace(' at ', ' '));
        const dateB = new Date(b.dueDate.replace(' at ', ' '));
        return dateA - dateB;
      });

    // Group assignments by course
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

    // Sort courses alphabetically and ensure assignments within each course are sorted by due date
    const sortedGroupedAssignments = Object.entries(groupedAssignments)
      .sort(([codeA], [codeB]) => codeA.localeCompare(codeB))
      .reduce((acc, [code, group]) => {
        // Sort assignments within each course by due date
        group.assignments.sort((a, b) => {
          const dateA = new Date(a.dueDate.replace(' at ', ' '));
          const dateB = new Date(b.dueDate.replace(' at ', ' '));
          return dateA - dateB;
        });
        acc[code] = group;
        return acc;
      }, {});

    return sortedGroupedAssignments;
  } catch (error) {
    console.error('Error fetching Canvas assignments:', error);
    throw error;
  }
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

// Stop auto-refresh
function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// Handle external links
ipcMain.handle('open-external-link', async (event, url) => {
  await shell.openExternal(url);
});

// Add this with other IPC handlers
ipcMain.handle('clear-stored-data', () => {
  clearStoredData();
  return true;
});
