const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config();

// Set the app name before anything else
app.name = 'To-Do';
app.setName('To-Do');

// Get user data path
const userDataPath = app.getPath('userData');
console.log('User data path:', userDataPath);

// Ensure the directory exists
try {
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
    console.log('Created user data directory');
  }
} catch (error) {
  console.error('Error creating user data directory:', error);
}

// Initialize data store with better performance options
let store;
try {
  store = new Store({
    defaults: {
      todos: [],
      taskStates: [],
      pinned: false,
      canvasApiKey: null,
      canvasApiUrl: 'https://canvas.uts.edu.au',
      hasCompletedFirstLaunch: false,
      completedTasksHistory: [],
      currentWeekStart: new Date().toISOString(),
      windowBounds: { x: 50, y: 45, width: 800, height: 600 },
      isMaximized: false,
      isFullScreen: false,
      streak: 0,
      lastVisit: null,
      taskNotes: {}
    }
  });
  
  // Test store access
  const testData = store.get('todos');
  console.log('Store initialized successfully. Current todos:', testData);
} catch (error) {
  console.error('Error initializing store:', error);
  // Fallback to memory store if file store fails
  store = {
    _data: {
      todos: [],
      pinned: false,
      canvasApiKey: null,
      hasCompletedFirstLaunch: false,
      taskNotes: {}
    },
    get: function(key, defaultValue) {
      return this._data[key] !== undefined ? this._data[key] : defaultValue;
    },
    set: function(key, value) {
      this._data[key] = value;
      console.log(`Memory store: set ${key}`);
      return true;
    },
    clear: function() {
      this._data = {
        todos: [],
        pinned: false,
        canvasApiKey: null,
        hasCompletedFirstLaunch: false,
        taskNotes: {}
      };
    }
  };
  console.log('Using memory store as fallback');
}

let mainWindow;

// Update the icon path resolution
const isDev = process.env.NODE_ENV === 'development';
const iconPath = isDev 
  ? path.resolve(__dirname, 'build', 'icon.png')
  : path.join(process.resourcesPath, 'build', 'icon.png');

// API key storage functions using electron-store
function storeCanvasApiKey(apiKey) {
  try {
    store.set('canvasApiKey', apiKey);
    store.set('hasCompletedFirstLaunch', true);
    console.log('API key stored successfully');
  } catch (error) {
    console.error('Error storing API key:', error);
    throw error;
  }
}

function getStoredCanvasApiKey() {
  try {
    const key = store.get('canvasApiKey');
    return key;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

function storeCanvasApiUrl(apiUrl) {
  try {
    store.set('canvasApiUrl', apiUrl);
    console.log('API URL stored successfully');
  } catch (error) {
    console.error('Error storing API URL:', error);
    throw error;
  }
}

function getStoredCanvasApiUrl() {
  try {
    const url = store.get('canvasApiUrl');
    return url;
  } catch (error) {
    console.error('Error getting API URL:', error);
    return null;
  }
}

function hasCompletedFirstLaunch() {
  try {
    return store.get('hasCompletedFirstLaunch', false);
  } catch (error) {
    console.error('Error checking first launch:', error);
    return false;
  }
}

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

// Add development tools
function setupDevTools() {
  // Install React/Redux DevTools
  if (isDev) {
    try {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
      installExtension(REACT_DEVELOPER_TOOLS)
        .then((name) => console.log(`Added Extension: ${name}`))
        .catch((err) => console.log('An error occurred: ', err));
    } catch (e) {
      console.log('Skipping React DevTools installation:', e);
    }
  }
}

// Enhanced store logging
const storeDebug = {
  onDidChange: (key, callback) => {
    if (isDev) {
      store.onDidChange(key, (newValue, oldValue) => {
        console.log(`Store value changed for ${key}:`, { old: oldValue, new: newValue });
        callback(newValue, oldValue);
      });
    }
  },
  set: (key, value) => {
    if (isDev) console.log(`Setting store value for ${key}:`, value);
    store.set(key, value);
  },
  get: (key, defaultValue) => {
    const value = store.get(key, defaultValue);
    if (isDev) console.log(`Getting store value for ${key}:`, value);
    return value;
  }
};

// Create the browser window
function createWindow() {
  // Get saved window bounds
  const defaultBounds = {
    width: 400,
    height: 600,
    x: undefined,
    y: undefined
  };
  const bounds = store.get('windowBounds', defaultBounds);
  
  mainWindow = new BrowserWindow({
    ...bounds,
    frame: true,
    transparent: false,
    alwaysOnTop: store.get('pinned', false),
    icon: iconPath,
    title: 'To-Do',
    show: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true
    }
  });

  // Restore window state
  if (store.get('isMaximized', false)) {
    mainWindow.maximize();
  }
  if (store.get('isFullScreen', false)) {
    mainWindow.setFullScreen(true);
  }

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Always open DevTools in development mode
    if (isDev) {
      mainWindow.webContents.openDevTools();
      console.log('DevTools opened in development mode');
    }
  });

  // Add window state logging
  if (isDev) {
    mainWindow.on('resize', () => {
      const bounds = mainWindow.getBounds();
      console.log('Window resized:', bounds);
    });

    mainWindow.on('move', () => {
      const bounds = mainWindow.getBounds();
      console.log('Window moved:', bounds);
    });
  }

  // Load the index.html file
  const indexPath = isDev
    ? path.join(__dirname, 'index.html')
    : path.join(app.getAppPath(), 'index.html');
  mainWindow.loadFile(indexPath);

  // Set window to stay on all workspaces/desktops
  mainWindow.setVisibleOnAllWorkspaces(true);

  // Defer non-essential operations
  setTimeout(() => {
    createMenu();
    if (process.platform === 'darwin') {
      setDockIcon();
    }
    
    // Check Canvas API key after a delay
    setTimeout(async () => {
      try {
        const apiKey = await getStoredCanvasApiKey();
        console.log('API key for Canvas:', apiKey ? 'Present' : 'Missing');
        const completedFirstLaunch = hasCompletedFirstLaunch();
        
        if (!completedFirstLaunch || !apiKey) {
          console.log('Showing Canvas modal for API key');
          mainWindow.webContents.send('show-canvas-modal');
        }
        
        // Start fetching assignments if we have an API key
        if (apiKey) {
          console.log('Triggering assignment refresh');
          mainWindow.webContents.send('refresh-assignments');
        }
      } catch (error) {
        console.error('Error during startup checks:', error);
      }
    }, 2000);
  }, 500);
}

// Create application menu - moved outside to be called later
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

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// When Electron is ready
app.whenReady().then(() => {
  createWindow();
  startAutoRefresh();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Add window state saving when closing
  mainWindow.on('close', (e) => {
    try {
      // Save window position and size
      const bounds = mainWindow.getBounds();
      store.set('windowBounds', bounds);
      
      // Save window state
      store.set('isMaximized', mainWindow.isMaximized());
      store.set('isFullScreen', mainWindow.isFullScreen());
    } catch (error) {
      console.error('Error saving window state:', error);
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', function () {
  stopAutoRefresh();
  if (process.platform !== 'darwin') app.quit();
});

// Add before-quit handler to ensure data is saved
app.on('before-quit', (e) => {
  try {
    // Save any pending changes
    const todos = store.get('todos', []);
    store.set('todos', todos);
    console.log('Final save before quitting - todos:', JSON.stringify(todos, null, 2));
  } catch (error) {
    console.error('Error saving data before quit:', error);
  }
});

// IPC handlers
ipcMain.handle('getTodos', () => {
  console.log('Getting todos from store');
  const taskStates = store.get('taskStates', []);
  const completedTasksHistory = store.get('completedTasksHistory', []);
  const currentWeekStart = store.get('currentWeekStart', new Date().toISOString());
  const taskNotes = store.get('taskNotes', {});
  
  console.log('Retrieved data:', { taskStates, completedTasksHistory, taskNotes });
  return {
    taskStates,
    completedTasksHistory,
    currentWeekStart,
    taskNotes
  };
});

ipcMain.handle('saveTodos', (event, data) => {
  console.log('Saving data to store:', data);
  store.set('taskStates', data.taskStates);
  store.set('completedTasksHistory', data.completedTasksHistory);
  store.set('currentWeekStart', data.currentWeekStart);
  store.set('taskNotes', data.taskNotes);
  return true;
});

ipcMain.handle('toggle-pin', () => {
  try {
    const currentPinned = store.get('pinned', false);
    const newPinned = !currentPinned;
    store.set('pinned', newPinned);
    mainWindow.setAlwaysOnTop(newPinned);
    return newPinned;
  } catch (error) {
    console.error('Error toggling pin:', error);
    return false;
  }
});

ipcMain.handle('store-canvas-api-key', async (event, apiKey) => {
  try {
    await storeCanvasApiKey(apiKey);
    console.log('Stored Canvas API key successfully');
    return true;
  } catch (error) {
    console.error('Error storing Canvas API key:', error);
    return false;
  }
});

ipcMain.handle('get-stored-canvas-api-key', async () => {
  try {
    const key = await getStoredCanvasApiKey();
    console.log('Retrieved Canvas API key:', key ? 'Present' : 'Missing');
    return key;
  } catch (error) {
    console.error('Error getting Canvas API key:', error);
    return null;
  }
});

ipcMain.handle('store-canvas-api-url', async (event, apiUrl) => {
  try {
    await storeCanvasApiUrl(apiUrl);
    console.log('Stored Canvas API URL successfully');
    return true;
  } catch (error) {
    console.error('Error storing Canvas API URL:', error);
    return false;
  }
});

ipcMain.handle('get-stored-canvas-api-url', async () => {
  try {
    const url = await getStoredCanvasApiUrl();
    console.log('Retrieved Canvas API URL:', url ? url : 'Missing');
    return url;
  } catch (error) {
    console.error('Error getting Canvas API URL:', error);
    return null;
  }
});

ipcMain.handle('fetch-canvas-assignments', async (event, apiKey, apiUrl) => {
  try {
    // Try to use provided key/url or get stored ones
    const storedApiKey = apiKey || await getStoredCanvasApiKey();
    const storedApiUrl = apiUrl || await getStoredCanvasApiUrl();
    
    console.log('Fetching Canvas assignments with API key:', storedApiKey ? 'Present' : 'Missing');
    console.log('Using Canvas API URL:', storedApiUrl);
    
    if (!storedApiKey) {
      throw new Error('Canvas API key not found');
    }

    if (!storedApiUrl) {
      throw new Error('Canvas API URL not configured');
    }

    // If new values were provided, store them
    if (apiKey) {
      await storeCanvasApiKey(apiKey);
    }
    if (apiUrl) {
      await storeCanvasApiUrl(apiUrl);
    }

    // Fetch only active courses with enrollments
    console.log('Fetching courses...');
    const coursesResponse = await fetch(`${storedApiUrl}/api/v1/courses?enrollment_state=active&enrollment_type=student&state[]=available&include[]=term`, {
      headers: {
        'Authorization': `Bearer ${storedApiKey}`
      }
    });
    
    if (!coursesResponse.ok) {
      console.error('Courses response not OK:', coursesResponse.status, await coursesResponse.text());
      if (coursesResponse.status === 401) {
        throw new Error('Invalid API key');
      }
      throw new Error(`Failed to fetch courses: ${coursesResponse.status}`);
    }

    const courses = await coursesResponse.json();
    console.log('Found courses:', courses.length);
    
    if (!courses || courses.length === 0) {
      console.log('No active courses found');
      return {};
    }

    // Find current term courses
    // First, identify the current term by finding the most recent one
    const now = new Date();
    let currentTerms = [];
    
    // Get all terms from courses
    const terms = {};
    courses.forEach(course => {
      if (course.term && !terms[course.term.id]) {
        terms[course.term.id] = course.term;
      }
    });
    
    // Find terms that include the current date
    Object.values(terms).forEach(term => {
      const endDate = term.end_at ? new Date(term.end_at) : null;
      const startDate = term.start_at ? new Date(term.start_at) : null;
      
      // If term has no dates, consider it current
      if (!startDate && !endDate) {
        currentTerms.push(term.id);
      }
      // If term has end date in the future, consider it current
      else if (endDate && endDate > now) {
        currentTerms.push(term.id);
      }
      // If term has start date in the past and no end date, consider it current
      else if (startDate && startDate < now && !endDate) {
        currentTerms.push(term.id);
      }
      // If term includes current date
      else if (startDate && endDate && startDate < now && endDate > now) {
        currentTerms.push(term.id);
      }
    });
    
    console.log('Current terms:', currentTerms);
    
    // Filter courses by current terms
    let currentCourses = courses;
    if (currentTerms.length > 0) {
      currentCourses = courses.filter(course => 
        course.term && currentTerms.includes(course.term.id)
      );
      console.log('Filtered to current term courses:', currentCourses.length);
    } else {
      // If we couldn't determine current terms, use all active courses
      console.log('Could not determine current terms, using all active courses');
    }

    // Fetch assignments and quizzes for each course
    const itemPromises = currentCourses.map(async (course) => {
      console.log(`Fetching assignments and quizzes for course: ${course.name}`);
      
      // Fetch assignments
      const assignmentsResponse = await fetch(
        `${storedApiUrl}/api/v1/courses/${course.id}/assignments?` + new URLSearchParams({
          'include[]': ['submission', 'description', 'due_at'],
          'order_by': 'due_at',
          'per_page': '100'
        }), {
          headers: {
            'Authorization': `Bearer ${storedApiKey}`
          }
        }
      );

      // Fetch quizzes
      const quizzesResponse = await fetch(
        `${storedApiUrl}/api/v1/courses/${course.id}/quizzes?` + new URLSearchParams({
          'per_page': '100'
        }), {
          headers: {
            'Authorization': `Bearer ${storedApiKey}`
          }
        }
      );
      
      let assignments = [];
      let quizzes = [];

      if (assignmentsResponse.ok) {
        assignments = await assignmentsResponse.json();
        console.log(`Found ${assignments.length} assignments for course: ${course.name}`);
      }

      if (quizzesResponse.ok) {
        quizzes = await quizzesResponse.json();
        console.log(`Found ${quizzes.length} quizzes for course: ${course.name}`);
      }

      // Use the same "now" reference as before for consistency
      // const now = new Date();
      
      // Process assignments
      const processedAssignments = await Promise.all(assignments
        .filter(assignment => {
          // Only filter out assignments that don't have a due date or aren't published
          return assignment.due_at && assignment.published && !assignment.locked_for_user;
        })
        .map(async assignment => {
          const submissionResponse = await fetch(
            `${storedApiUrl}/api/v1/courses/${course.id}/assignments/${assignment.id}/submissions/self`, {
              headers: {
                'Authorization': `Bearer ${storedApiKey}`
              }
            }
          );

          let submissionData = null;
          if (submissionResponse.ok) {
            submissionData = await submissionResponse.json();
          }

          const dueDate = new Date(assignment.due_at);
          const isPastDue = dueDate <= now;
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

          const isSubmitted = Boolean(
            submissionData && (
              submissionData.workflow_state === 'submitted' ||
              submissionData.workflow_state === 'graded' ||
              (submissionData.submitted_at && submissionData.attempt > 0)
            )
          );

          return {
            id: assignment.id,
            name: assignment.name,
            points: assignment.points_possible,
            dueDate: formattedDate,
            relativeDue: fromNow,
            htmlUrl: assignment.html_url,
            courseName: course.name,
            courseCode: course.course_code || course.name,
            isSubmitted: isSubmitted,
            type: 'assignment',
            isPastDue: isPastDue
          };
        }));

      // Process quizzes
      const processedQuizzes = quizzes
        .filter(quiz => {
          // Only filter out quizzes that don't have a due date or aren't published
          return quiz.due_at && quiz.published;
        })
        .map(quiz => {
          const dueDate = new Date(quiz.due_at);
          const isPastDue = dueDate <= now;
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

          return {
            id: quiz.id,
            name: quiz.title,
            points: quiz.points_possible,
            dueDate: formattedDate,
            relativeDue: fromNow,
            htmlUrl: quiz.html_url,
            courseName: course.name,
            courseCode: course.course_code || course.name,
            isSubmitted: quiz.has_submitted_submissions,
            type: 'quiz',
            isPastDue: isPastDue
          };
        });

      return [...processedAssignments, ...processedQuizzes];
    });

    // Wait for all fetches to complete
    const allItems = (await Promise.all(itemPromises))
      .flat()
      .sort((a, b) => {
        const dateA = new Date(a.dueDate.replace(' at ', ' '));
        const dateB = new Date(b.dueDate.replace(' at ', ' '));
        return dateA - dateB;
      });

    // Group items by course
    const groupedItems = {};
    
    allItems.forEach(item => {
      if (!groupedItems[item.courseCode]) {
        groupedItems[item.courseCode] = {
          courseName: item.courseName,
          courseCode: item.courseCode,
          assignments: []
        };
      }
      groupedItems[item.courseCode].assignments.push(item);
    });

    // Sort courses alphabetically and ensure items within each course are sorted by due date
    const sortedGroupedItems = Object.entries(groupedItems)
      .sort(([codeA], [codeB]) => codeA.localeCompare(codeB))
      .reduce((acc, [code, group]) => {
        group.assignments.sort((a, b) => {
          const dateA = new Date(a.dueDate.replace(' at ', ' '));
          const dateB = new Date(b.dueDate.replace(' at ', ' '));
          return dateA - dateB;
        });
        acc[code] = group;
        return acc;
      }, {});

    return sortedGroupedItems;
  } catch (error) {
    console.error('Error fetching Canvas items:', error);
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

// Add handler to check if in development mode
ipcMain.handle('is-development-mode', () => {
  return process.env.NODE_ENV === 'development';
});

// Add streak-related IPC handlers
ipcMain.handle('getStreak', () => {
  try {
    const streak = store.get('streak', 0);
    console.log('Getting streak:', streak);
    return streak;
  } catch (error) {
    console.error('Error getting streak:', error);
    return 0;
  }
});

ipcMain.handle('setStreak', (event, streak) => {
  try {
    store.set('streak', streak);
    console.log('Setting streak:', streak);
    return true;
  } catch (error) {
    console.error('Error setting streak:', error);
    return false;
  }
});

ipcMain.handle('getLastVisit', () => {
  try {
    const lastVisit = store.get('lastVisit', null);
    console.log('Getting last visit:', lastVisit);
    return lastVisit;
  } catch (error) {
    console.error('Error getting last visit:', error);
    return null;
  }
});

ipcMain.handle('setLastVisit', (event, date) => {
  try {
    store.set('lastVisit', date);
    console.log('Setting last visit:', date);
    return true;
  } catch (error) {
    console.error('Error setting last visit:', error);
    return false;
  }
});

// Add handlers for store operations
ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store-set', (event, { key, value }) => {
  return store.set(key, value);
});

// Add IPC handler for getAppPath
ipcMain.handle('getAppPath', () => {
  return app.getAppPath();
});
