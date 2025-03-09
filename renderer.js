// DOM Elements
const todoListEl = document.getElementById('todoList');
const newTodoInput = document.getElementById('newTodoInput');
const addTodoButton = document.getElementById('addTodoButton');
const pinButton = document.getElementById('pinButton');
const canvasButton = document.getElementById('canvasButton');
const canvasModal = document.getElementById('canvasModal');
const closeModalBtn = document.querySelector('.close');
const canvasApiKeyInput = document.getElementById('canvasApiKey');
const loadAssignmentsButton = document.getElementById('loadAssignmentsButton');
const assignmentsList = document.getElementById('assignmentsList');
const taskSections = document.querySelectorAll('.task-section');
const taskHeaders = document.querySelectorAll('.task-header');
const taskCheckboxes = document.querySelectorAll('.task-checkbox');
const addTaskButton = document.querySelector('.add-task-button');
const taskInput = document.querySelector('.task-input');
const prioritySelect = document.querySelector('.priority-select');
const dateInput = document.querySelector('.date-input');
const actionButtons = document.querySelectorAll('.action-button');
const createHeaderButton = document.querySelector('.create-header-button');
const toast = document.getElementById('toast');
const apiHelpLink = document.getElementById('apiHelpLink');
const apiInstructionsModal = document.getElementById('apiInstructionsModal');
const fetchAssignmentsBtn = document.getElementById('fetchAssignmentsBtn');
const createHeaderModal = document.getElementById('createHeaderModal');
const headerNameInput = document.getElementById('headerName');
const createHeaderBtn = document.getElementById('createHeaderBtn');
const closeModalBtns = document.querySelectorAll('.close, .close-modal');
const headerSelect = document.querySelector('.header-select');
const taskNotesModal = document.getElementById('taskNotesModal');
const taskNotesInput = document.getElementById('taskNotes');
const taskTitleDisplay = document.querySelector('.task-title-display');
const saveNotesButton = document.querySelector('.save-notes');
const taskContextMenu = document.getElementById('taskContextMenu');
let contextMenuTarget = null;

// Todo data
let todos = [];

// Add an undo history
let undoHistory = [];
const MAX_UNDO_HISTORY = 50;

// Add completed tasks history
let completedTasksHistory = [];

// Add week start tracking
let currentWeekStart = getWeekStart();

// Initialize drag and drop variables
let draggedItem = null;
let draggedItemIndex = null;

// Streak messages for different levels
const streakMessages = {
  0: [
    "Time to lock in!",
    "Come on, let's get this streak going!",
    "No time like the present to start!"
  ],
  1: [
    "Nice work, you made it! One day, let's make it two!",
    "You're on a roll! (Okay, one day, but still!)",
    "Just getting warmed up, huh? Nice!"
  ],
  2: [
    "Two days? You must be feeling unstoppable.",
    "Look at you, showing up two days in a row!",
    "Is this your new thing? I'm here for it!"
  ],
  3: [
    "Three days? You're practically a productivity machine.",
    "Whoa, someone's serious about this!",
    "You're a streak legend in the making!"
  ],
  5: [
    "Five days! Almost halfway to a week. Keep it going!",
    "Five days? You're officially making moves.",
    "That's a five-day streak of greatness."
  ],
  7: [
    "One week, you absolute overachiever!",
    "Seven days? You're practically a productivity guru now.",
    "A week down, and you're just getting started!"
  ],
  10: [
    "Double digits, baby! Let's keep this party going.",
    "Ten days in, and you're looking like a pro.",
    "You've hit 10 days — time to unlock your true potential."
  ],
  15: [
    "15 days?! Are you even human at this point?",
    "You're making consistency look easy.",
    "At this rate, you might just live in this app."
  ],
  20: [
    "20 days! Did you just wake up and decide to crush it?",
    "You've got a serious streak going — don't stop now!",
    "20 days? Let's see how long you can keep this up."
  ],
  25: [
    "A quarter of a century — 25 days! You're unstoppable.",
    "You're on fire! Let's make this a habit.",
    "25 days in, and you're owning it."
  ],
  30: [
    "One full month! You're basically a to-do list superstar now.",
    "30 days? No one can tell you nothing.",
    "You've officially leveled up. 30 days — respect."
  ],
  40: [
    "Forty days? You must have some secret powers.",
    "You're not stopping, are you? 40 days strong!",
    "Who's this streak machine? Oh, wait, it's you."
  ],
  50: [
    "Halfway to 100. 50 days? I'm impressed!",
    "50 days! At this point, it's a lifestyle.",
    "I'm not saying you're a legend, but… you're a legend."
  ],
  60: [
    "60 days?! You've crossed the two-month threshold!",
    "Two months of success. Who even are you?!",
    "You're seriously crushing it. 60 days strong."
  ],
  70: [
    "70 days? You're in the productivity hall of fame.",
    "You might be addicted… but we're here for it.",
    "This streak? Unstoppable."
  ],
  80: [
    "80 days! You're basically a professional streaker (but in a good way).",
    "You're getting so close to the big 100. Let's goooo!",
    "80 days in a row? Wow. Just… wow."
  ],
  90: [
    "90 days! This is beyond impressive!",
    "You're this close to 100. Don't stop now.",
    "It's been 90 days of straight success. You're a powerhouse."
  ],
  100: [
    "100 days!! Do you even sleep, or are you just that productive?",
    "Congratulations! You are officially the streak king/queen. 100 days of pure excellence.",
    "100 days. You've unlocked the highest level of consistency. #Legendary"
  ]
};

// Add this to store task notes
let taskNotes = {};
let currentTaskItem = null;

// Function to save state to undo history
function saveToUndoHistory() {
  undoHistory.push(JSON.stringify(todos));
  if (undoHistory.length > MAX_UNDO_HISTORY) {
    undoHistory.shift();
  }
}

// Function to undo last action
function undo() {
  if (undoHistory.length > 0) {
    const previousState = undoHistory.pop();
    todos = JSON.parse(previousState);
    saveTodos();
    renderTodoList();
  }
}

// Save todos
async function saveTodos() {
  // Get all task items and their states
  const taskItems = document.querySelectorAll('.task-item');
  const taskStates = Array.from(taskItems).map(item => {
    const taskId = item.dataset.id;
    return {
      id: taskId,
      text: item.querySelector('.task-text').textContent,
      isChecked: item.querySelector('.task-checkbox').checked,
      priority: item.querySelector('.priority-badge').textContent,
      dueDate: item.querySelector('.due-relative')?.textContent,
      notes: taskNotes[taskId] || ''
    };
  });

  const appData = {
    todos: todos,
    completedTasksHistory: completedTasksHistory,
    currentWeekStart: currentWeekStart.toISOString(),
    taskStates: taskStates
  };
  
  await window.api.saveTodos(appData);
  localStorage.setItem('taskNotes', JSON.stringify(taskNotes));
}

// Load todos on startup
async function loadTodos() {
  try {
    const appData = await window.api.getTodos();
    if (appData) {
      todos = appData.todos || [];
      completedTasksHistory = appData.completedTasksHistory || [];
      currentWeekStart = appData.currentWeekStart ? new Date(appData.currentWeekStart) : getWeekStart();
      
      // Check if we need to reset the weekly count
      checkWeeklyReset();
  renderTodoList();
      updateProductivityStats();
      
      // Load notes and task states
      const savedNotes = localStorage.getItem('taskNotes');
      if (savedNotes) {
        taskNotes = JSON.parse(savedNotes);
      }
      
      // Restore task states
      if (appData.taskStates) {
        appData.taskStates.forEach(state => {
          const taskItem = document.querySelector(`.task-item[data-id="${state.id}"]`);
          if (taskItem) {
            const checkbox = taskItem.querySelector('.task-checkbox');
            const taskText = taskItem.querySelector('.task-text');
            const priorityBadge = taskItem.querySelector('.priority-badge');
            const dueDate = taskItem.querySelector('.due-relative');
            
            if (checkbox) checkbox.checked = state.isChecked;
            if (taskText) taskText.textContent = state.text;
            if (priorityBadge) {
              const priority = state.priority.toLowerCase();
              priorityBadge.className = `priority-badge priority-${priority}`;
              priorityBadge.textContent = state.priority;
            }
            if (dueDate && state.dueDate) dueDate.textContent = state.dueDate;
            
            // Update completed class
            if (state.isChecked) {
              taskText.classList.add('completed');
            } else {
              taskText.classList.remove('completed');
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
    // Initialize with defaults if loading fails
    todos = [];
    completedTasksHistory = [];
    currentWeekStart = getWeekStart();
  }
}

// Render todo list
function renderTodoList() {
  todoListEl.innerHTML = '';
  let currentSection = null;
  let sectionEl = null;
  
  todos.forEach((todo, index) => {
    const todoEl = document.createElement('div');
    todoEl.dataset.index = index;
    
    if (todo.isHeader) {
      // Create new section for this header
      todoEl.className = 'todo-header';
      todoEl.innerHTML = `
        <span class="todo-title" contenteditable="true" spellcheck="false">${todo.title}</span>
        <button class="delete-button" data-index="${index}">✕</button>
      `;
      
      // Create section container for tasks
      sectionEl = document.createElement('div');
      sectionEl.className = 'todo-section';
      sectionEl.dataset.header = todo.title;
      sectionEl.dataset.headerIndex = index;
      
      todoListEl.appendChild(todoEl);
      todoListEl.appendChild(sectionEl);
      currentSection = sectionEl;
    } else {
      // Add task to current section or main list
      todoEl.className = 'todo-item';
      todoEl.draggable = true;
      todoEl.innerHTML = `
        <div class="drag-handle">⋮⋮</div>
        <input type="checkbox" class="todo-checkbox" data-index="${index}" ${todo.isChecked ? 'checked' : ''}>
        <span class="todo-title ${todo.isChecked ? 'completed' : ''}" contenteditable="true" spellcheck="false">${todo.title}</span>
        <button class="delete-button" data-index="${index}">✕</button>
      `;
      
      if (currentSection) {
        currentSection.appendChild(todoEl);
      } else {
        todoListEl.appendChild(todoEl);
      }
    }

    // Add event listeners for the current todo element
    const titleEl = todoEl.querySelector('.todo-title');
    const checkboxEl = todoEl.querySelector('.todo-checkbox');
    const deleteButtonEl = todoEl.querySelector('.delete-button');
    
    // Add editing listeners
    titleEl.addEventListener('blur', handleTitleEdit);
    titleEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        titleEl.blur();
      }
      if (e.key === 'Escape') {
        titleEl.textContent = todos[index].title;
        titleEl.blur();
      }
    });

    // Add checkbox listener
    if (checkboxEl) {
      checkboxEl.addEventListener('change', handleCheckboxChange);
    }

    // Add delete button listener
    if (deleteButtonEl) {
      deleteButtonEl.addEventListener('click', handleDeleteTodo);
    }

    // Add drag listeners for non-header items
    if (!todo.isHeader) {
      todoEl.addEventListener('dragstart', handleDragStart);
      todoEl.addEventListener('dragend', handleDragEnd);
    }
  });

  // Add drop zones to sections and main list
  document.querySelectorAll('.todo-section, .todo-list').forEach(dropZone => {
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
  });
}

// Set up drag and drop
function setupDragAndDrop() {
  const taskItems = document.querySelectorAll('.task-item');
  const taskLists = document.querySelectorAll('.task-list');
  
  taskItems.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
  });
  
  taskLists.forEach(list => {
    list.addEventListener('dragover', handleDragOver);
    list.addEventListener('dragenter', handleDragEnter);
    list.addEventListener('dragleave', handleDragLeave);
    list.addEventListener('drop', handleDrop);
  });
}

// Drag and drop handlers
function handleDragStart(e) {
  if (e.target.closest('[contenteditable="true"]:focus')) {
    e.preventDefault();
    return;
  }
  
  draggedItem = e.currentTarget;
  draggedItem.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  draggedItem.classList.remove('dragging');
  draggedItem = null;
  
  document.querySelectorAll('.task-list').forEach(list => {
    list.classList.remove('drag-over');
  });
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  const dropZone = e.currentTarget;
  dropZone.classList.remove('drag-over');
  
  if (!draggedItem) return;
  
  const list = dropZone.closest('.task-list');
  const items = [...list.children];
  const draggedIndex = items.indexOf(draggedItem);
  const dropIndex = items.indexOf(e.target.closest('.task-item'));
  
  if (draggedIndex !== -1 && dropIndex !== -1) {
    if (draggedIndex < dropIndex) {
      e.target.closest('.task-item').after(draggedItem);
    } else {
      e.target.closest('.task-item').before(draggedItem);
    }
  } else {
    list.appendChild(draggedItem);
  }
  
  updateTaskCounts();
}

// Handle task edit
function handleTaskEdit(e) {
  const taskText = e.target;
  const newText = taskText.textContent.trim();
  
  if (newText === '') {
    taskText.textContent = taskText.dataset.originalText || 'New Task';
    return;
  }
  
  taskText.dataset.originalText = newText;
}

// Add a new todo
function addTodo() {
  const title = newTodoInput.value.trim();
  const isHeader = document.getElementById('typeToggle').checked;
  
  if (title === '') {
    return; // Don't add empty items
  }
  
  saveToUndoHistory();
  
  todos.push({
    title: title,
    isChecked: false,
    isHeader: isHeader
  });
  
  newTodoInput.value = '';
  saveTodos();
  renderTodoList();
}

// Handle checkbox changes
function handleCheckboxChange(e) {
  saveToUndoHistory();
  const index = parseInt(e.target.dataset.index);
  todos[index].isChecked = e.target.checked;
  saveTodos();
  renderTodoList();
}

// Handle deleting a todo
function handleDeleteTodo(e) {
  saveToUndoHistory();
  const index = parseInt(e.target.dataset.index);
  todos.splice(index, 1);
  saveTodos();
  renderTodoList();
}

// Toggle pin status
async function togglePinStatus() {
  const isPinned = await window.api.togglePin();
  pinButton.textContent = isPinned ? 'Unpin Window' : 'Pin Window';
}

// Update the showCanvasModal function
async function showCanvasModal() {
  const storedKey = await window.api.getStoredCanvasApiKey();
  
  // Add help link if it doesn't exist
  if (!document.querySelector('.api-help-link')) {
    const helpLink = document.createElement('a');
    helpLink.href = '#';
    helpLink.className = 'api-help-link';
    helpLink.textContent = 'How do I find my API key?';
    helpLink.onclick = (e) => {
      e.preventDefault();
      showApiInstructionsModal();
    };
    
    const authContainer = document.querySelector('.canvas-auth');
    if (authContainer) {
    authContainer.appendChild(helpLink);
    }
  }
  
  if (storedKey) {
    canvasApiKeyInput.value = storedKey;
  }
  
  canvasModal.style.display = 'block';
}

// Close Canvas modal
function closeCanvasModal() {
  canvasModal.style.display = 'none';
}

// Show API instructions modal
function showApiInstructionsModal() {
  apiInstructionsModal.style.display = 'block';
}

// Fetch Canvas assignments
async function fetchCanvasAssignments() {
  const apiKey = canvasApiKeyInput.value.trim();
  
  if (!apiKey) {
    alert('Please enter your Canvas API key');
    return;
  }

  try {
    const groupedAssignments = await window.api.fetchCanvasAssignments(apiKey);
    
    // If we got here, the API key was valid, so close the modal and store the key
    await window.api.storeCanvasApiKey(apiKey);
    closeCanvasModal();
    
    // Update course filter dropdown
    const courseFilter = document.querySelector('.canvas-filter');
    courseFilter.innerHTML = '<option value="">All Courses</option>';
    Object.values(groupedAssignments).forEach(course => {
      const option = document.createElement('option');
      option.value = course.courseCode;
      option.textContent = course.courseCode;
      courseFilter.appendChild(option);
    });

    displayAssignments(groupedAssignments);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to fetch assignments. Please check your API key and try again.');
  }
}

function displayAssignments(groupedAssignments) {
    assignmentsList.innerHTML = '';
    
  if (Object.keys(groupedAssignments).length === 0) {
      assignmentsList.innerHTML = '<div class="no-assignments">No upcoming assignments found</div>';
      return;
    }

  Object.values(groupedAssignments).forEach(course => {
      const courseHeader = document.createElement('div');
      courseHeader.className = 'course-header';
      courseHeader.innerHTML = `
        <h3>${course.courseCode}</h3>
        <div class="course-name">${course.courseName}</div>
      `;
      assignmentsList.appendChild(courseHeader);

      course.assignments.forEach(assignment => {
        const assignmentEl = document.createElement('div');
        assignmentEl.className = 'assignment-item';
        
        const submissionStatus = assignment.isSubmitted 
          ? '<span class="submission-status submitted">✓ Submitted</span>'
          : '<span class="submission-status pending">Not submitted</span>';

        assignmentEl.innerHTML = `
          <div class="assignment-details">
            <div class="assignment-header">
              <div class="assignment-title-row">
                <div class="assignment-title">${assignment.name}</div>
                ${submissionStatus}
              </div>
              <div class="assignment-points">${assignment.points ? assignment.points + ' points' : ''}</div>
            </div>
            <div class="assignment-due">
              <span class="due-absolute">Due: ${assignment.dueDate}</span>
              <span class="due-relative">${assignment.relativeDue}</span>
            </div>
            <div class="assignment-links">
              <button class="canvas-link" data-url="${assignment.htmlUrl}">View in Canvas</button>
            </div>
          </div>
          <button class="add-assignment-button" 
            data-course="${assignment.courseCode}" 
            data-name="${assignment.name}" 
            data-due="${assignment.relativeDue}">
            Add to List
          </button>
        `;
        
        assignmentsList.appendChild(assignmentEl);
      });
    });
}

function addAssignmentToTasks(name, dueDate) {
  taskInput.value = `${name} (Due: ${dueDate})`;
  dateInput.value = new Date(dueDate).toISOString().split('T')[0];
  prioritySelect.value = 'high';
  addNewTask();
  showToast('Assignment added to tasks');
}

// Add the handleTitleEdit function
function handleTitleEdit(e) {
  const titleEl = e.target;
  const todoEl = titleEl.closest('[data-index]');
  const index = parseInt(todoEl.dataset.index);
  const newTitle = titleEl.textContent.trim();
  
  // Don't save empty titles
  if (newTitle === '') {
    titleEl.textContent = todos[index].title;
    return;
  }
  
  saveToUndoHistory();
  
  // Update the todo
  todos[index].title = newTitle;
  
  // If it's a header, update the section's header attribute
  if (todos[index].isHeader) {
    const section = todoEl.nextElementSibling;
    if (section && section.classList.contains('todo-section')) {
      section.dataset.header = newTitle;
    }
  }
  
  saveTodos();
}

// Add this new function to update header options
function updateHeaderOptions() {
  if (!headerSelect) return;
  
  // Save current selection
  const currentValue = headerSelect.value;
  
  // Clear existing options
  headerSelect.innerHTML = '';
  
  // Get all task sections
  const taskSections = document.querySelectorAll('.task-section');
  
  // Add options for each section
  taskSections.forEach(section => {
    const headerTitle = section.querySelector('.task-title');
    if (headerTitle) {
      const option = document.createElement('option');
      option.value = headerTitle.textContent.toLowerCase().replace(/\s+/g, '-');
      option.textContent = headerTitle.textContent;
      headerSelect.appendChild(option);
      
      // Restore selection if it still exists
      if (option.value === currentValue) {
        option.selected = true;
      }
    }
  });
}

// Get the start of the current week (Sunday)
function getWeekStart() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

// Check and reset weekly tasks if needed
function checkWeeklyReset() {
  const newWeekStart = getWeekStart();
  if (newWeekStart > currentWeekStart) {
    // It's a new week, clear the history
    completedTasksHistory = [];
    currentWeekStart = newWeekStart;
    
    // Update the display immediately
    const tasksThisWeekEl = document.getElementById('tasksThisWeek');
    if (tasksThisWeekEl) {
      tasksThisWeekEl.textContent = '0 Tasks';
    }
    
    // Save the reset state
    saveTodos();
    
    showToast('Weekly task count reset');
  }
}

// Initialize the app
function initializeApp() {
  // Check for weekly reset on startup
  checkWeeklyReset();
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up drag and drop
  setupDragAndDrop();
  
  // Initialize header options
  updateHeaderOptions();
  
  // Update productivity stats
  updateProductivityStats();
  
  // Update last synced time
  updateLastSyncedTime();
  setInterval(updateLastSyncedTime, 60000); // Update every minute
  
  // Check for weekly reset every hour
  setInterval(checkWeeklyReset, 3600000); // Check every hour
  setupContextMenu();
}

// Set up event listeners
function setupEventListeners() {
  // Task section headers (expand/collapse)
  taskHeaders.forEach(header => {
    header.addEventListener('click', toggleTaskSection);
    
    // Make header titles editable
    const headerTitle = header.querySelector('.task-title');
    if (headerTitle) {
      headerTitle.addEventListener('blur', handleHeaderEdit);
      headerTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          headerTitle.blur();
        }
      });
    }
  });
  
  // Task checkboxes
  taskCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', handleTaskCompletion);
  });
  
  // Add task button
  if (addTaskButton) {
    addTaskButton.addEventListener('click', addNewTask);
  }
  
  // Task input (enter key)
  if (taskInput) {
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addNewTask();
      }
    });
  }
  
  // Delete buttons
  document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', handleDeleteTask);
  });
  
  // Priority badges
  document.querySelectorAll('.priority-badge').forEach(badge => {
    badge.addEventListener('click', handlePriorityChange);
  });
  
  // Make task text editable
  document.querySelectorAll('.task-text').forEach(taskText => {
    taskText.addEventListener('blur', handleTaskEdit);
    taskText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
      }
    });
  });
  
  // Action buttons
  actionButtons.forEach((button, index) => {
    button.addEventListener('click', () => handleActionButton(index));
  });
  
  // Create header button
  if (createHeaderButton) {
    createHeaderButton.addEventListener('click', showCreateHeaderModal);
  }
  
  // Load assignments button
  if (loadAssignmentsButton) {
    loadAssignmentsButton.addEventListener('click', () => {
    showCanvasModal();
  });
  }
  
  // Canvas modal close button
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeCanvasModal);
  }
  
  // API help link
  if (apiHelpLink) {
    apiHelpLink.addEventListener('click', (e) => {
      e.preventDefault();
      showApiInstructionsModal();
    });
  }
  
  // Fetch assignments button
  if (fetchAssignmentsBtn) {
    fetchAssignmentsBtn.addEventListener('click', fetchCanvasAssignments);
  }

  // Create header modal
  if (createHeaderBtn) {
    createHeaderBtn.addEventListener('click', handleCreateHeader);
  }

  // Close modal buttons
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      createHeaderModal.style.display = 'none';
      canvasModal.style.display = 'none';
      apiInstructionsModal.style.display = 'none';
    });
  });

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === createHeaderModal) {
      createHeaderModal.style.display = 'none';
    }
  });

  // Handle Enter key in header name input
  if (headerNameInput) {
    headerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleCreateHeader();
      }
    });
  }
  
  // Add event listener for canvas links and add assignment buttons
  assignmentsList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('canvas-link')) {
      e.preventDefault();
      const url = e.target.dataset.url;
      if (url) {
        await window.api.openExternalLink(url);
      }
    }
    if (e.target.classList.contains('add-assignment-button')) {
      const button = e.target;
      const name = button.dataset.name;
      const dueDate = button.dataset.due;
      showAddToHeaderModal(name, dueDate);
    }
  });

  // Add course filter and sort event listeners
  document.querySelectorAll('.canvas-filter').forEach((filter, index) => {
    filter.addEventListener('change', (e) => {
      const selectedValue = e.target.value;
      const assignmentItems = Array.from(document.querySelectorAll('.assignment-item'));
      const courseHeaders = document.querySelectorAll('.course-header');
      const assignmentsList = document.getElementById('assignmentsList');

      // First dropdown: Course filter
      if (index === 0) {
        if (selectedValue === '') {
          // Show all assignments and headers
          assignmentItems.forEach(item => item.style.display = 'flex');
          courseHeaders.forEach(header => header.style.display = 'block');
        } else {
          // Show only selected course
          assignmentItems.forEach(item => {
            const courseCode = item.querySelector('.add-assignment-button').dataset.course;
            item.style.display = courseCode === selectedValue ? 'flex' : 'none';
          });
          courseHeaders.forEach(header => {
            const courseCode = header.querySelector('h3').textContent;
            header.style.display = courseCode === selectedValue ? 'block' : 'none';
          });
        }
      }
      // Third dropdown: Due date sorting
      else if (index === 2) {
        // Remove all current items
        courseHeaders.forEach(header => header.remove());
        assignmentItems.forEach(item => item.remove());

        // Sort assignments by relative due date
        assignmentItems.sort((a, b) => {
          const relDueA = a.querySelector('.due-relative').textContent;
          const relDueB = b.querySelector('.due-relative').textContent;
          
          // Convert relative dates to days
          const getDays = (relDue) => {
            const match = relDue.match(/in (\d+) days?|(\d+) days? ago|today|tomorrow|yesterday/i);
            if (!match) return Infinity;
            
            if (match[0] === 'today') return 0;
            if (match[0] === 'tomorrow') return 1;
            if (match[0] === 'yesterday') return -1;
            
            const days = parseInt(match[1] || match[2]);
            return relDue.includes('ago') ? -days : days;
          };

          const daysA = getDays(relDueA);
          const daysB = getDays(relDueB);

          return selectedValue === 'asc' ? daysA - daysB : daysB - daysA;
        });

        // Re-append assignments in sorted order
        assignmentItems.forEach(item => {
          assignmentsList.appendChild(item);
        });
      }
    });
  });

  // Add delete buttons to existing headers if they don't have them
  document.querySelectorAll('.task-header').forEach(header => {
    if (!header.querySelector('.delete-header-button')) {
      const headerRight = header.querySelector('.task-header-right') || document.createElement('div');
      headerRight.className = 'task-header-right';
      
      // Add delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-header-button';
      deleteButton.textContent = '✕';
      deleteButton.addEventListener('click', handleDeleteHeader);
      headerRight.appendChild(deleteButton);
      
      // Add headerRight to header if it's new
      if (!header.querySelector('.task-header-right')) {
        header.appendChild(headerRight);
      }
    }
  });

  // Add delete button listeners to all header delete buttons
  document.querySelectorAll('.delete-header-button').forEach(button => {
    button.addEventListener('click', handleDeleteHeader);
  });

  // Task notes modal close buttons
  const taskNotesCloseButtons = taskNotesModal.querySelectorAll('.close, .close-modal');
  taskNotesCloseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      taskNotesModal.style.display = 'none';
      currentTaskItem = null;
    });
  });

  // Close task notes modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === taskNotesModal) {
      taskNotesModal.style.display = 'none';
      currentTaskItem = null;
    }
  });

  // Tutorial button
  const tutorialButton = document.getElementById('showTutorial');
  const tutorialModal = document.getElementById('tutorialModal');
  
  if (tutorialButton && tutorialModal) {
    tutorialButton.addEventListener('click', () => {
      tutorialModal.style.display = 'block';
    });

    // Close tutorial modal
    const tutorialCloseBtn = tutorialModal.querySelector('.close');
    if (tutorialCloseBtn) {
      tutorialCloseBtn.addEventListener('click', () => {
        tutorialModal.style.display = 'none';
      });
    }

    // Close tutorial modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === tutorialModal) {
        tutorialModal.style.display = 'none';
      }
    });
  }
}

// Toggle task section (expand/collapse)
function toggleTaskSection(e) {
  if (e.target.classList.contains('delete-header-button') || 
      e.target.classList.contains('task-title') && e.target === document.activeElement) {
    return; // Don't toggle when clicking delete button or editing title
  }
  
  const header = e.currentTarget;
  const section = header.closest('.task-section');
  const taskList = section.querySelector('.task-list');
  
  // Toggle display
  if (taskList.style.display === 'none' || taskList.style.display === '') {
    taskList.style.display = 'block';
  } else {
    taskList.style.display = 'none';
  }
}

// Handle task completion
function handleTaskCompletion(e) {
  const checkbox = e.target;
  const taskText = checkbox.nextElementSibling;
  
  if (checkbox.checked) {
    taskText.classList.add('completed');
    // Add to completed tasks history when checked
    completedTasksHistory.push({
      text: taskText.textContent,
      completedAt: new Date()
    });
    showToast('Task completed!');
  } else {
    taskText.classList.remove('completed');
    // Remove from history when unchecked
    const taskIndex = completedTasksHistory.findIndex(task => task.text === taskText.textContent);
    if (taskIndex !== -1) {
      completedTasksHistory.splice(taskIndex, 1);
    }
  }
  
  saveTodos(); // Save after updating completion status
  updateTaskCounts();
  updateProductivityStats();
}

// Update the addNewTask function
function addNewTask() {
  if (!taskInput || !taskInput.value.trim()) return;
  
  const taskText = taskInput.value.trim();
  const priority = prioritySelect ? prioritySelect.value : 'medium';
  const dueDate = dateInput ? dateInput.value : '';
  
  // Create new task element
  const taskItem = document.createElement('div');
  taskItem.className = 'task-item';
  taskItem.draggable = true;
  
  // Format the task text with due date if available
  const displayText = dueDate 
    ? `${taskText} (Due: ${new Date(dueDate).toLocaleDateString()})`
    : taskText;
  
  // Set task HTML
  taskItem.innerHTML = `
    <div class="drag-handle">⋮⋮</div>
    <input type="checkbox" class="task-checkbox">
    <span class="task-text" contenteditable="true" spellcheck="false">${displayText}</span>
    <div class="task-metadata">
      ${dueDate ? `<span class="due-relative">${getRelativeDueDate(dueDate)}</span>` : ''}
      <button class="priority-badge priority-${priority}">${priority.charAt(0).toUpperCase() + priority.slice(1)}</button>
    </div>
    <button class="delete-button">✕</button>
  `;
  
  // Find the selected task list
  const selectedHeader = headerSelect ? headerSelect.value : null;
  let targetTaskList;
  
  if (selectedHeader) {
    // Find the task list for the selected header
    const headerText = headerSelect.options[headerSelect.selectedIndex].text;
    const taskSections = document.querySelectorAll('.task-section');
    for (const section of taskSections) {
      const sectionTitle = section.querySelector('.task-title');
      if (sectionTitle && sectionTitle.textContent === headerText) {
        targetTaskList = section.querySelector('.task-list');
        break;
      }
    }
  }
  
  // If no target found, default to first task list
  if (!targetTaskList) {
    targetTaskList = document.querySelector('.task-section:first-of-type .task-list');
  }
  
  if (targetTaskList) {
    targetTaskList.appendChild(taskItem);
    
    // Set up all event listeners for the new task
    setupTaskEventListeners(taskItem);
    
    // Clear input
    taskInput.value = '';
    
    // Show toast
    showToast('Task added successfully!');
    
    // Update task counts and save
    updateTaskCounts();
    saveTodos();
  }
}

// Handle action buttons
function handleActionButton(index) {
  switch(index) {
    case 0: // PIN
      alert('App pinned to desktop');
      break;
    case 1: // CLEAR TASKS
      clearCompletedTasks();
      break;
  }
}

// Clear completed tasks
function clearCompletedTasks() {
  const completedTasks = document.querySelectorAll('.task-checkbox:checked');
  let count = 0;
  
  completedTasks.forEach(checkbox => {
    const taskItem = checkbox.closest('.task-item');
    taskItem.remove();
    count++;
  });
  
  if (count > 0) {
    showToast(`Cleared ${count} completed tasks`);
    updateTaskCounts();
  } else {
    showToast('No completed tasks to clear');
  }
}

// Show create header modal
function showCreateHeaderModal() {
  createHeaderModal.style.display = 'block';
  headerNameInput.value = '';
  headerNameInput.focus();
}

// Update handleCreateHeader to include delete button
function handleCreateHeader(headerNameOrEvent = null) {
  let headerName;
  
  // Check if the argument is an event or a string
  if (headerNameOrEvent && typeof headerNameOrEvent === 'string') {
    headerName = headerNameOrEvent;
  } else {
    headerName = headerNameInput.value.trim();
  }
  
  if (!headerName) {
    showToast('Please enter a header name');
    return;
  }
  
  // Create new header section
  const taskSection = document.createElement('div');
  taskSection.className = 'task-section';
  taskSection.innerHTML = `
    <div class="task-header">
      <div class="task-header-left">
        <h2 class="task-title" contenteditable="true" spellcheck="false">${headerName}</h2>
        <span class="task-count">0</span>
      </div>
      <div class="task-header-right">
        <button class="delete-header-button">✕</button>
      </div>
    </div>
    <div class="task-list" style="display: block"></div>
  `;
  
  // Add the new section before the "Add New Task" section
  const addTaskSection = document.querySelector('.add-task-section');
  if (addTaskSection) {
    addTaskSection.parentNode.insertBefore(taskSection, addTaskSection);
  } else {
    // If add task section not found, append to the main container
    document.querySelector('.app-container').appendChild(taskSection);
  }
  
  // Add event listeners to the new header
  const header = taskSection.querySelector('.task-header');
  const headerTitle = header.querySelector('.task-title');
  const deleteButton = header.querySelector('.delete-header-button');
  
  header.addEventListener('click', toggleTaskSection);
  headerTitle.addEventListener('blur', handleHeaderEdit);
  headerTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      headerTitle.blur();
    }
  });

  // Add delete button listener
  if (deleteButton) {
    deleteButton.addEventListener('click', handleDeleteHeader);
  }
  
  // Set up drag and drop for the new section
  const taskList = taskSection.querySelector('.task-list');
  taskList.addEventListener('dragover', handleDragOver);
  taskList.addEventListener('dragenter', handleDragEnter);
  taskList.addEventListener('dragleave', handleDragLeave);
  taskList.addEventListener('drop', handleDrop);
  
  // Update header options in the Add Task section
  updateHeaderOptions();
  
  // Close modal if it was opened from there
  if (createHeaderModal.style.display === 'block') {
    createHeaderModal.style.display = 'none';
  }
  
  showToast('New header created');
  
  // Return the created section for use in other functions
  return taskSection;
}

// Add function to handle header deletion
function handleDeleteHeader(e) {
  e.stopPropagation(); // Prevent the click from triggering the toggleTaskSection
  
  const header = e.target.closest('.task-section');
  const headerTitle = header.querySelector('.task-title').textContent;
  
  if (confirm(`Are you sure you want to delete the "${headerTitle}" section and all its tasks?`)) {
    header.remove();
    updateHeaderOptions();
    showToast(`Deleted "${headerTitle}" section`);
    updateTaskCounts();
  }
}

// Update task counts for all sections
function updateTaskCounts() {
  document.querySelectorAll('.task-section').forEach(section => {
    const taskCount = section.querySelectorAll('.task-item').length;
    const countElement = section.querySelector('.task-count');
    if (countElement) {
      countElement.textContent = taskCount;
    }
  });
}

// Update productivity stats
function updateProductivityStats() {
  // Check for weekly reset before updating stats
  checkWeeklyReset();
  
  // Get all current tasks
  const allTasks = document.querySelectorAll('.task-item');
  const currentCompletedTasks = document.querySelectorAll('.task-checkbox:checked');
  
  // Calculate completion rate based on current tasks
  const completionRate = allTasks.length > 0 
    ? Math.round((currentCompletedTasks.length / allTasks.length) * 100) 
    : 0;
  
  // Update completion rate display
  const completionRateEl = document.getElementById('completionRate');
  if (completionRateEl) {
    completionRateEl.textContent = `${completionRate}%`;
  }
  
  // Count tasks completed this week from history
  const tasksThisWeek = completedTasksHistory.length;
  
  // Update tasks this week display
  const tasksThisWeekEl = document.getElementById('tasksThisWeek');
  if (tasksThisWeekEl) {
    tasksThisWeekEl.textContent = `${tasksThisWeek} Tasks`;
  }
  
  // Update streak
  updateStreak();
}

// Update streak count and message
async function updateStreak() {
  // Get current streak from storage
  let streak = await window.api.getStreak();
  const lastVisit = await window.api.getLastVisit();
  const today = new Date().toDateString();
  
  if (lastVisit === today) {
    // Already visited today, keep current streak
  } else if (lastVisit === new Date(Date.now() - 86400000).toDateString()) {
    // Visited yesterday, increment streak
    streak++;
    await window.api.setStreak(streak);
  } else if (lastVisit) {
    // Missed a day, reset streak
    streak = 1;
    await window.api.setStreak(streak);
  } else {
    // First visit
    streak = 1;
    await window.api.setStreak(streak);
  }
  
  // Update last visit
  await window.api.setLastVisit(today);
  
  // Update streak display
  const streakCountEl = document.getElementById('streakCount');
  const streakMessageEl = document.getElementById('streakMessage');
  
  if (streakCountEl) {
    streakCountEl.textContent = `${streak} Day${streak !== 1 ? 's' : ''} Streak`;
  }
  
  if (streakMessageEl) {
    streakMessageEl.textContent = getStreakMessage(streak);
  }
}

// Get a random message for the current streak level
function getStreakMessage(streak) {
  // Find the closest milestone that's less than or equal to the current streak
  const milestones = Object.keys(streakMessages).map(Number).sort((a, b) => b - a);
  const milestone = milestones.find(m => streak >= m) || 0;
  
  // Get random message for this milestone
  const messages = streakMessages[milestone];
  const randomIndex = Math.floor(Math.random() * messages.length);
  let message = messages[randomIndex];
  
  // Remove any existing day count from the message
  message = message.replace(/^\d+\s*days?[!?]?\s*/i, '');
  
  // Add the actual streak number at the start
  return `${streak} days! ${message}`;
}

// Show toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.opacity = '1';
  
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 3000);
}

// Update last synced time
function updateLastSyncedTime() {
  const lastSyncedElement = document.getElementById('lastSynced');
  if (!lastSyncedElement) return;
  
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  lastSyncedElement.textContent = `Last synced: ${timeString}`;
}

// Handle priority change
function handlePriorityChange(e) {
  const badge = e.currentTarget;
  const currentPriority = badge.textContent.trim().toLowerCase();
  let newPriority;
  
  // Cycle through priorities
  switch(currentPriority) {
    case 'low':
      newPriority = 'medium';
      break;
    case 'medium':
      newPriority = 'high';
      break;
    case 'high':
      newPriority = 'low';
      break;
    default:
      newPriority = 'medium';
  }
  
  // Update badge class and text
  badge.className = `priority-badge priority-${newPriority}`;
  badge.textContent = newPriority.charAt(0).toUpperCase() + newPriority.slice(1);
  
  showToast(`Priority changed to ${newPriority}`);
}

// Handle task deletion
function handleDeleteTask(e) {
  e.stopPropagation(); // Prevent event bubbling
  const taskItem = e.target.closest('.task-item');
  if (!taskItem) return;

  // Save to undo history before deleting
  saveToUndoHistory();

  // Remove the task from completedTasksHistory if it was completed
  const taskText = taskItem.querySelector('.task-text').textContent;
  const taskIndex = completedTasksHistory.findIndex(task => task.text === taskText);
  if (taskIndex !== -1) {
    completedTasksHistory.splice(taskIndex, 1);
  }

  // Remove the task element
  taskItem.remove();

  // Update UI
  updateTaskCounts();
  updateProductivityStats();
    saveTodos();
  
  showToast('Task deleted');
}

// Update handleHeaderEdit to save changes
function handleHeaderEdit(e) {
  const headerTitle = e.target;
  const newTitle = headerTitle.textContent.trim();
  
  if (newTitle === '') {
    headerTitle.textContent = headerTitle.dataset.originalTitle || 'New Section';
    return;
  }
  
  headerTitle.dataset.originalTitle = newTitle;
  
  // Update header options
  updateHeaderOptions();
  
  // Save the changes
  saveTodos();
  
  showToast('Section name updated');
}

// Handle adding an assignment
function handleAddAssignment(e) {
  const button = e.target;
  const name = button.dataset.name;
  const dueDate = button.dataset.due;
  showAddToHeaderModal(name, dueDate);
}

// Add new modal for selecting header when adding assignment
function showAddToHeaderModal(assignmentName, dueDate) {
  // Create modal HTML
  const modalHTML = `
    <div id="addToHeaderModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Add Assignment to Header</h2>
        <div class="modal-input-container">
          <label for="headerSelect">Select Header</label>
          <select id="headerSelect" class="modal-input">
            ${getHeaderOptions()}
          </select>
          <div class="create-new-header">
            <label>
              <input type="checkbox" id="createNewHeaderCheck"> Create new header
            </label>
            <input type="text" id="newHeaderName" class="modal-input" placeholder="New header name" style="display: none;">
          </div>
        </div>
        <div class="modal-actions">
          <button id="addTaskButton" class="primary-button">Add Task</button>
          <button id="cancelButton" class="secondary-button">Cancel</button>
        </div>
      </div>
    </div>
  `;

  // Add modal to document
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Get modal elements
  const modal = document.getElementById('addToHeaderModal');
  const createNewHeaderCheck = document.getElementById('createNewHeaderCheck');
  const newHeaderNameInput = document.getElementById('newHeaderName');
  const headerSelect = document.getElementById('headerSelect');
  const closeButton = modal.querySelector('.close');
  const addTaskButton = document.getElementById('addTaskButton');
  const cancelButton = document.getElementById('cancelButton');

  // Add event listeners
  createNewHeaderCheck.addEventListener('change', (e) => {
    newHeaderNameInput.style.display = e.target.checked ? 'block' : 'none';
    headerSelect.disabled = e.target.checked;
  });

  // Close button event listener
  closeButton.addEventListener('click', closeAddToHeaderModal);
  cancelButton.addEventListener('click', closeAddToHeaderModal);

  // Add task button event listener
  addTaskButton.addEventListener('click', () => {
    addAssignmentToSelectedHeader(assignmentName, dueDate);
  });

  // Show modal
  modal.style.display = 'block';

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAddToHeaderModal();
    }
  });
}

function getHeaderOptions() {
  const headers = document.querySelectorAll('.task-section .task-title');
  let options = '<option value="">Select a header</option>';
  headers.forEach(header => {
    const headerText = header.textContent.trim();
    options += `<option value="${headerText}">${headerText}</option>`;
  });
  return options;
}

function closeAddToHeaderModal() {
  const modal = document.getElementById('addToHeaderModal');
  if (modal) {
    modal.remove();
  }
}

// Update addAssignmentToSelectedHeader to handle Canvas assignments better
function addAssignmentToSelectedHeader(assignmentName, dueDate) {
  const createNewHeader = document.getElementById('createNewHeaderCheck').checked;
  const headerSelect = document.getElementById('headerSelect');
  const newHeaderNameInput = document.getElementById('newHeaderName');
  
  let targetSection;
  
  if (createNewHeader) {
    const newHeaderName = newHeaderNameInput.value.trim();
    if (!newHeaderName) {
      showToast('Please enter a header name');
      return;
    }
    targetSection = handleCreateHeader(newHeaderName);
  } else {
    const headerText = headerSelect.value;
    if (!headerText) {
      showToast('Please select a header');
      return;
    }
    const sections = document.querySelectorAll('.task-section');
    for (const section of sections) {
      const title = section.querySelector('.task-title');
      if (title && title.textContent === headerText) {
        targetSection = section;
        break;
      }
    }
  }

  if (targetSection) {
    // Parse the due date - handle both date strings and relative dates
    let dueDateObj;
    if (dueDate.includes('in') || dueDate.includes('ago') || dueDate === 'today' || dueDate === 'tomorrow' || dueDate === 'yesterday') {
      // Convert relative date to actual date
      dueDateObj = new Date();
      const match = dueDate.match(/in (\d+) days?|(\d+) days? ago|today|tomorrow|yesterday/i);
      if (match) {
        if (dueDate === 'today') {
          // Keep current date
        } else if (dueDate === 'tomorrow') {
          dueDateObj.setDate(dueDateObj.getDate() + 1);
        } else if (dueDate === 'yesterday') {
          dueDateObj.setDate(dueDateObj.getDate() - 1);
        } else {
          const days = parseInt(match[1] || match[2]);
          if (dueDate.includes('ago')) {
            dueDateObj.setDate(dueDateObj.getDate() - days);
          } else {
            dueDateObj.setDate(dueDateObj.getDate() + days);
          }
        }
      }
    } else {
      dueDateObj = new Date(dueDate);
    }

    // Format the display date
    const displayDate = dueDateObj.toLocaleDateString();
    const relativeDate = getRelativeDueDate(dueDateObj);
    
    // Add task to the section
    const taskList = targetSection.querySelector('.task-list');
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.draggable = true;
    taskItem.innerHTML = `
      <div class="drag-handle">⋮⋮</div>
      <input type="checkbox" class="task-checkbox">
      <span class="task-text" contenteditable="true" spellcheck="false">${assignmentName} (Due: ${displayDate})</span>
      <div class="task-metadata">
        <span class="due-relative">${relativeDate}</span>
        <button class="priority-badge priority-high">High</button>
      </div>
      <button class="delete-button">
        <i class="fas fa-times"></i>
      </button>
    `;

    taskList.appendChild(taskItem);
    
    // Add event listeners to new task
    setupTaskEventListeners(taskItem);
    
    // Update task count
    updateTaskCounts();
    
    // Show success message
    showToast(`Assignment added to ${targetSection.querySelector('.task-title').textContent}`);
  }

  // Close modal
  closeAddToHeaderModal();
}

// Helper function to set up event listeners for new tasks
function setupTaskEventListeners(taskItem) {
  const checkbox = taskItem.querySelector('.task-checkbox');
  const taskText = taskItem.querySelector('.task-text');
  const priorityBadge = taskItem.querySelector('.priority-badge');
  const deleteButton = taskItem.querySelector('.delete-button');

  checkbox.addEventListener('change', handleTaskCompletion);
  taskText.addEventListener('blur', handleTaskEdit);
  taskText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
  });
  priorityBadge.addEventListener('click', handlePriorityChange);
  deleteButton.addEventListener('click', (e) => {
    e.preventDefault();
    handleDeleteTask(e);
  });

  taskItem.addEventListener('dragstart', handleDragStart);
  taskItem.addEventListener('dragend', handleDragEnd);

  // Add context menu event listener
  taskItem.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenuTarget = taskItem;
    
    // Position the context menu
    taskContextMenu.style.display = 'block';
    const x = e.clientX;
    const y = e.clientY;
    
    // Adjust position if menu would go off screen
    const menuRect = taskContextMenu.getBoundingClientRect();
    const adjustedX = x + menuRect.width > window.innerWidth ? window.innerWidth - menuRect.width : x;
    const adjustedY = y + menuRect.height > window.innerHeight ? window.innerHeight - menuRect.height : y;
    
    taskContextMenu.style.left = adjustedX + 'px';
    taskContextMenu.style.top = adjustedY + 'px';
  });
}

// Update the getRelativeDueDate function to handle weeks, months, and years
function getRelativeDueDate(dateStr) {
  const dueDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  
  // Past dates
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays < 7) return `${absDays} days ago`;
    if (absDays < 14) return '1 week ago';
    if (absDays < 30) return `${Math.floor(absDays / 7)} weeks ago`;
    if (absDays < 60) return '1 month ago';
    if (absDays < 365) return `${Math.floor(absDays / 30)} months ago`;
    return `${Math.floor(absDays / 365)} years ago`;
  }
  
  // Future dates
  if (diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < 14) return 'in 1 week';
  if (diffDays < 30) return `in ${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 60) return 'in 1 month';
  if (diffDays < 365) return `in ${Math.floor(diffDays / 30)} months`;
  return `in ${Math.floor(diffDays / 365)} years`;
}

// Add this function to handle opening the notes modal
function openTaskNotes(taskItem) {
  const taskText = taskItem.querySelector('.task-text').textContent;
  const taskId = taskItem.dataset.id || Date.now().toString();
  taskItem.dataset.id = taskId;
  
  // Store reference to current task item
  currentTaskItem = taskItem;
  
  // Display task info
  taskTitleDisplay.textContent = taskText;
  
  // Show metadata if available
  const metadata = [];
  const dueDate = taskItem.querySelector('.due-relative');
  const priority = taskItem.querySelector('.priority-badge');
  
  if (dueDate) metadata.push(dueDate.textContent);
  if (priority) metadata.push(priority.textContent);
  
  const taskMetadata = document.querySelector('.task-metadata');
  taskMetadata.textContent = metadata.join(' • ');
  
  // Load existing notes
  taskNotesInput.value = taskNotes[taskId] || '';
  
  // Show modal
  taskNotesModal.style.display = 'block';
  taskNotesInput.focus();
  
  // Save button handler
  const saveButton = taskNotesModal.querySelector('.save-notes');
  const closeButtons = taskNotesModal.querySelectorAll('.close, .close-modal');
  
  // Remove any existing event listeners
  saveButton.replaceWith(saveButton.cloneNode(true));
  closeButtons.forEach(btn => btn.replaceWith(btn.cloneNode(true)));
  
  // Get the fresh elements after replacement
  const newSaveButton = taskNotesModal.querySelector('.save-notes');
  const newCloseButtons = taskNotesModal.querySelectorAll('.close, .close-modal');
  
  // Add new event listeners
  newSaveButton.addEventListener('click', () => {
    const taskId = currentTaskItem.dataset.id;
    taskNotes[taskId] = taskNotesInput.value;
    
    // Save the task's current state
    const taskState = {
      notes: taskNotesInput.value,
      isChecked: currentTaskItem.querySelector('.task-checkbox').checked,
      priority: currentTaskItem.querySelector('.priority-badge').textContent,
      dueDate: currentTaskItem.querySelector('.due-relative')?.textContent
    };
    
    saveTodos();
    taskNotesModal.style.display = 'none';
    showToast('Notes saved successfully!');
    currentTaskItem = null;
  });
  
  newCloseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      taskNotesModal.style.display = 'none';
      currentTaskItem = null;
    });
  });
}

// Add this to setupEventListeners function after other event listeners
function setupContextMenu() {
  // Close context menu on any click outside
  document.addEventListener('click', () => {
    taskContextMenu.style.display = 'none';
  });

  // Prevent context menu from closing when clicking inside it
  taskContextMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Handle context menu actions
  taskContextMenu.addEventListener('click', (e) => {
    const action = e.target.closest('.context-menu-item')?.dataset.action;
    if (!action || !contextMenuTarget) return;

    switch (action) {
      case 'add-subtask':
        handleAddSubtask(contextMenuTarget);
        break;
      case 'view-notes':
        openTaskNotes(contextMenuTarget);
        break;
      case 'change-due-date':
        handleChangeDueDate(contextMenuTarget);
        break;
    }
    taskContextMenu.style.display = 'none';
  });
}

// Handle adding a subtask
function handleAddSubtask(parentTask) {
  // Create subtask container if it doesn't exist
  let subtaskContainer = parentTask.nextElementSibling;
  if (!subtaskContainer || !subtaskContainer.classList.contains('subtask-container')) {
    subtaskContainer = document.createElement('div');
    subtaskContainer.className = 'subtask-container';
    parentTask.after(subtaskContainer);
    parentTask.classList.add('has-subtasks');
  }

  // Create new subtask
  const subtask = document.createElement('div');
  subtask.className = 'task-item subtask-item';
  subtask.draggable = true;
  subtask.innerHTML = `
    <div class="drag-handle">⋮⋮</div>
    <input type="checkbox" class="task-checkbox">
    <span class="task-text" contenteditable="true" spellcheck="false">New Subtask</span>
    <div class="task-metadata">
      <button class="priority-badge priority-medium">Medium</button>
    </div>
    <button class="delete-button">✕</button>
  `;

  subtaskContainer.appendChild(subtask);
  setupTaskEventListeners(subtask);
  
  // Focus the new subtask for editing
  const taskText = subtask.querySelector('.task-text');
  taskText.focus();
  document.execCommand('selectAll', false, null);
}

// Handle changing due date
function handleChangeDueDate(taskItem) {
  const datePickerContainer = document.createElement('div');
  datePickerContainer.className = 'date-picker-container';
  datePickerContainer.innerHTML = `
    <input type="date" class="date-input">
    <button class="save-date">Save</button>
    <button class="cancel-date">Cancel</button>
  `;

  const currentDueDate = taskItem.querySelector('.due-relative')?.textContent;
  const dateInput = datePickerContainer.querySelector('.date-input');
  
  // Set current date if it exists
  if (currentDueDate) {
    const date = parseDueDate(currentDueDate);
    if (date) {
      dateInput.value = date.toISOString().split('T')[0];
    }
  }

  // Position the date picker
  const metadata = taskItem.querySelector('.task-metadata');
  metadata.appendChild(datePickerContainer);

  // Add event listeners
  datePickerContainer.querySelector('.save-date').addEventListener('click', () => {
    const newDate = dateInput.value;
    if (newDate) {
      updateTaskDueDate(taskItem, newDate);
    }
    datePickerContainer.remove();
  });

  datePickerContainer.querySelector('.cancel-date').addEventListener('click', () => {
    datePickerContainer.remove();
  });

  // Focus the date input
  dateInput.focus();
}

// Helper function to parse relative due date
function parseDueDate(relativeDueDate) {
  const today = new Date();
  const matches = {
    'today': 0,
    'tomorrow': 1,
    'yesterday': -1,
    'in (\\d+) days?': (days) => parseInt(days),
    '(\\d+) days? ago': (days) => -parseInt(days),
    'in (\\d+) weeks?': (weeks) => parseInt(weeks) * 7,
    '(\\d+) weeks? ago': (weeks) => -parseInt(weeks) * 7,
    'in (\\d+) months?': (months) => {
      const date = new Date(today);
      date.setMonth(date.getMonth() + parseInt(months));
      return Math.round((date - today) / (1000 * 60 * 60 * 24));
    },
    '(\\d+) months? ago': (months) => {
      const date = new Date(today);
      date.setMonth(date.getMonth() - parseInt(months));
      return Math.round((date - today) / (1000 * 60 * 60 * 24));
    }
  };

  for (const [pattern, handler] of Object.entries(matches)) {
    const regex = new RegExp(pattern, 'i');
    const match = relativeDueDate.match(regex);
    if (match) {
      const days = typeof handler === 'function' ? handler(match[1]) : handler;
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date;
    }
  }
  return null;
}

// Update task due date
function updateTaskDueDate(taskItem, newDate) {
  const metadata = taskItem.querySelector('.task-metadata');
  let dueElement = metadata.querySelector('.due-relative');
  
  if (!dueElement) {
    dueElement = document.createElement('span');
    dueElement.className = 'due-relative';
    metadata.insertBefore(dueElement, metadata.firstChild);
  }
  
  const relativeDate = getRelativeDueDate(newDate);
  dueElement.textContent = relativeDate;
  
  // Update task text to include due date
  const taskText = taskItem.querySelector('.task-text');
  const baseText = taskText.textContent.replace(/\s*\(Due:.*\)$/, '');
  taskText.textContent = `${baseText} (Due: ${new Date(newDate).toLocaleDateString()})`;
  
  saveTodos();
  showToast('Due date updated');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);