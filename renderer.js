// DOM Elements
const todoListEl = document.getElementById('todoList');
const newTodoInput = document.getElementById('newTodoInput');
const addTodoButton = document.getElementById('addTodoButton');
const pinButton = document.getElementById('pinButton');
const canvasButton = document.getElementById('canvasButton');
const canvasModal = document.getElementById('canvasModal');
const closeModalBtn = document.querySelector('.close');
const canvasApiKeyInput = document.getElementById('canvasApiKey');
const canvasApiUrlInput = document.getElementById('canvasApiUrl');
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
const themeToggle = document.getElementById('themeToggle');
const colorPicker = document.getElementById('themeColorPicker');
const colorPreview = document.getElementById('colorPreview');
const tutorialModal = document.getElementById('tutorialModal');
const showTutorialBtn = document.getElementById('showTutorial');
let canvasFilters; // Canvas filters will be initialized when needed
let contextMenuTarget = null;

// Add these to your DOM Elements section at the top
const sectionHeaders = document.querySelectorAll('.section-header');
const sectionContents = document.querySelectorAll('.section-content');

// Theme handling
function setTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  window.api.store.set('darkTheme', isDark);
}

// Initialize theme
window.api.store.get('darkTheme').then(isDark => {
  themeToggle.checked = isDark;
  setTheme(isDark);
});

// Theme toggle event listener
themeToggle.addEventListener('change', (e) => {
  setTheme(e.target.checked);
  showToast(e.target.checked ? 'Dark theme enabled' : 'Light theme enabled');
});

// Theme color handling
function setThemeColor(color) {
  document.documentElement.style.setProperty('--primary-color', color);
  window.api.store.set('themeColor', color);
  colorPicker.value = color;
  colorPreview.style.backgroundColor = color;
}

// Initialize theme color
window.api.store.get('themeColor').then(color => {
  if (color) {
    setThemeColor(color);
  } else {
    setThemeColor('#a78bfa'); // Default color
  }
});

// Color picker event listener
colorPicker.addEventListener('input', (e) => {
  setThemeColor(e.target.value);
});

colorPicker.addEventListener('change', () => {
  showToast('Theme color updated');
});

// Function to show the tutorial modal
function showTutorialModal() {
  if (tutorialModal) {
    tutorialModal.style.display = 'block';
    console.log('Tutorial modal displayed');
  } else {
    console.error('Tutorial modal element not found');
  }
}

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

// Add auto-save functionality
let autoSaveTimeout = null;
const AUTO_SAVE_DELAY = 1000; // 1 second

function scheduleAutoSave() {
  console.log('Scheduling auto-save...');
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }
  autoSaveTimeout = setTimeout(() => {
    console.log('Auto-save triggered');
    saveTodos();
  }, AUTO_SAVE_DELAY);
}

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

// Add helper function for recursive subtask handling
function getSubtasksRecursively(taskItem) {
  const subtasks = [];
  const subtaskContainer = taskItem.nextElementSibling;
  
  if (subtaskContainer && subtaskContainer.classList.contains('subtask-container')) {
    Array.from(subtaskContainer.children).forEach(subtaskItem => {
      if (subtaskItem.classList.contains('task-item')) {
        const subtaskData = {
          text: subtaskItem.querySelector('.task-text')?.textContent || '',
          isChecked: subtaskItem.querySelector('input[type="checkbox"]')?.checked || false,
          priority: subtaskItem.querySelector('.priority-badge')?.textContent || 'Low',
          notes: subtaskItem.querySelector('.notes')?.value || '',
          subtasks: getSubtasksRecursively(subtaskItem) // Recursively get nested subtasks
        };
        subtasks.push(subtaskData);
      }
    });
  }
  
  return subtasks;
}

// Add helper function for creating subtasks recursively
function createSubtasksRecursively(subtasks, parentContainer) {
  subtasks.forEach(subtask => {
    const subtaskItem = document.createElement('div');
    subtaskItem.className = 'task-item subtask-item';
    if (subtask.subtasks && subtask.subtasks.length > 0) {
      subtaskItem.classList.add('has-subtasks');
    }
    subtaskItem.draggable = true;
    
    // Generate a unique ID for the subtask
    subtaskItem.dataset.id = Date.now().toString();
    
    // Check if subtask has notes
    const hasNotes = subtask.notes && subtask.notes.trim() !== '';
    if (hasNotes) {
      taskNotes[subtaskItem.dataset.id] = subtask.notes;
    }
    
    subtaskItem.innerHTML = `
      <div class="drag-handle">⋮⋮</div>
      <input type="checkbox" class="task-checkbox" ${subtask.isChecked ? 'checked' : ''}>
      <span class="task-text" contenteditable="true" spellcheck="false">${subtask.text}</span>
      <div class="task-metadata">
        <button class="priority-badge priority-${subtask.priority.toLowerCase()}">${subtask.priority}</button>
        ${hasNotes ? '<span class="notes-indicator" title="This task has notes"><i class="fas fa-sticky-note"></i></span>' : ''}
      </div>
      <button class="delete-button">✕</button>
    `;
    
    parentContainer.appendChild(subtaskItem);
    setupTaskEventListeners(subtaskItem);
    
    // If this subtask has nested subtasks, create a new container for them
    if (subtask.subtasks && subtask.subtasks.length > 0) {
      const nestedSubtaskContainer = document.createElement('div');
      nestedSubtaskContainer.className = 'subtask-container';
      parentContainer.appendChild(nestedSubtaskContainer);
      createSubtasksRecursively(subtask.subtasks, nestedSubtaskContainer);
    }
  });
}

// Update saveTodos function to use recursive subtask handling
async function saveTodos() {
  console.log('Saving todos to store');
  const taskSections = document.querySelectorAll('.task-section');
  if (!taskSections.length) {
    console.error('Could not find any task sections');
    return;
  }
  
  const sections = Array.from(taskSections).map(section => {
    const headerTitle = section.querySelector('.task-title')?.textContent || 'Tasks';
    const taskList = section.querySelector('.task-list');
    const tasks = Array.from(taskList.children).map(item => {
      if (item.classList.contains('task-item')) {
        // Get task ID or create one if it doesn't exist
        const taskId = item.dataset.id || Date.now().toString();
        item.dataset.id = taskId;
        
        // Extract the ISO date from the task text
        const taskText = item.querySelector('.task-text')?.textContent || '';
        const dueDateMatch = taskText.match(/\(Due: (.*?)\)/);
        const dueDateISO = dueDateMatch ? dueDateMatch[1] : null;
        
        // Get the relative due date from the metadata
        const relativeDueDate = item.querySelector('.due-relative')?.textContent || null;
        
        const taskData = {
          id: taskId,
          text: taskText,
          isChecked: item.querySelector('input[type="checkbox"]')?.checked || false,
          priority: item.querySelector('.priority-badge')?.textContent || 'Low',
          notes: taskNotes[taskId] || '',
          header: headerTitle,
          subtasks: getSubtasksRecursively(item),
          dueDate: relativeDueDate,
          dueDateISO: dueDateISO
        };
        return taskData;
      }
      return null;
    }).filter(task => task !== null);
    
    return {
      header: headerTitle,
      tasks: tasks
    };
  });
  
  console.log('Saving sections:', sections);
  
  // Save both the task sections and completed tasks history
  await window.electronAPI.saveTodos({
    taskStates: sections,
    completedTasksHistory: completedTasksHistory,
    currentWeekStart: currentWeekStart.toISOString(),
    taskNotes: taskNotes
  });
}

// Update loadTodos function to use recursive subtask handling
async function loadTodos() {
  console.log('Loading todos from store');
  const data = await window.electronAPI.getTodos();
  
  if (!data) {
    console.log('No data to load');
    return;
  }

  const sections = data.taskStates || [];
  completedTasksHistory = data.completedTasksHistory || [];
  currentWeekStart = data.currentWeekStart ? new Date(data.currentWeekStart) : getWeekStart();
  
  // Load task notes if available
  if (data.taskNotes) {
    taskNotes = data.taskNotes;
  }
  
  console.log('Loaded sections:', sections);
  
  if (!Array.isArray(sections)) {
    console.log('No sections to load');
    return;
  }

  // Clear existing sections
  const existingSections = document.querySelectorAll('.task-section');
  existingSections.forEach(section => section.remove());
  
  // Create sections and add tasks
  sections.forEach(section => {
    if (!section.header || !Array.isArray(section.tasks)) {
      console.log('Invalid section data:', section);
      return;
    }
    
    // Create section
    const taskSection = handleCreateHeader(section.header);
    const taskList = taskSection.querySelector('.task-list');
    
    // Add tasks to section
    section.tasks.forEach(task => {
      // Create main task
      const taskItem = document.createElement('div');
      taskItem.className = 'task-item';
      if (task.subtasks && task.subtasks.length > 0) {
        taskItem.classList.add('has-subtasks');
      }
      taskItem.draggable = true;
      
      // Set task ID
      if (task.id) {
        taskItem.dataset.id = task.id;
        // Store notes in taskNotes object
        if (task.notes) {
          taskNotes[task.id] = task.notes;
        }
      } else {
        taskItem.dataset.id = Date.now().toString();
      }
      
      // Check if task has notes
      const hasNotes = task.id && task.notes && task.notes.trim() !== '';

      // Get the relative due date if we have a due date
      let relativeDueDate = '';
      if (task.dueDateISO) {
        relativeDueDate = getRelativeDueDate(task.dueDateISO);
      }
      
      // Reconstruct task text with due date if available
      let displayText = task.text;
      if (task.dueDateISO) {
        // Remove any existing due date from the text
        displayText = displayText.replace(/\s*\(Due:.*?\)/, '');
        // Add the due date
        displayText = `${displayText} (Due: ${task.dueDateISO})`;
      }
      
      taskItem.innerHTML = `
        <div class="drag-handle">⋮⋮</div>
        <input type="checkbox" class="task-checkbox" ${task.isChecked ? 'checked' : ''}>
        <span class="task-text" contenteditable="true" spellcheck="false">${displayText}</span>
        <div class="task-metadata">
          ${task.dueDateISO ? `<span class="due-relative">${relativeDueDate}</span>` : ''}
          <button class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</button>
          ${hasNotes ? '<span class="notes-indicator" title="This task has notes"><i class="fas fa-sticky-note"></i></span>' : ''}
        </div>
        <button class="delete-button">✕</button>
      `;
      
      // Add task to list
      taskList.appendChild(taskItem);
      
      // Set up event listeners
      setupTaskEventListeners(taskItem);
      
      // Create subtasks if any exist
      if (task.subtasks && task.subtasks.length > 0) {
        const subtaskContainer = document.createElement('div');
        subtaskContainer.className = 'subtask-container';
        taskList.appendChild(subtaskContainer);
        createSubtasksRecursively(task.subtasks, subtaskContainer);
      }
    });
  });
  
  // Update UI elements
  updateTaskCounts();
  updateProductivityStats();
  
  // Schedule the next auto-save
  scheduleAutoSave();
}

// Auto-save todos every second
setInterval(saveTodos, 1000);

// Render todo list
function renderTodoList() {
  console.log('Rendering todo list with todos:', todos);
  todoListEl.innerHTML = '';
  let currentSection = null;
  let sectionEl = null;
  
  todos.forEach((todo, index) => {
    const todoEl = document.createElement('div');
    todoEl.dataset.index = index;
    todoEl.dataset.id = todo.id; // Add ID to element
    
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

    // Add event listeners
    setupTodoEventListeners(todoEl, todo);
  });
  
  console.log('Finished rendering todo list');
}

// Helper function to set up event listeners for a todo element
function setupTodoEventListeners(todoEl, todo) {
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
      titleEl.textContent = todo.title;
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
}

// Set up drag and drop
function setupDragAndDrop() {
  const taskItems = document.querySelectorAll('.task-item');
  const taskLists = document.querySelectorAll('.task-list');
  const taskSections = document.querySelectorAll('.task-section');
  const taskHeaders = document.querySelectorAll('.task-header');
  const appContainer = document.querySelector('.app-container');
  
  // Make task items draggable
  taskItems.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
  });
  
  // Make task lists droppable
  taskLists.forEach(list => {
    list.addEventListener('dragover', handleDragOver);
    list.addEventListener('dragenter', handleDragEnter);
    list.addEventListener('dragleave', handleDragLeave);
    list.addEventListener('drop', handleDrop);
  });

  // Make task headers droppable for tasks
  taskHeaders.forEach(header => {
    header.addEventListener('dragover', handleTaskOverHeader);
    header.addEventListener('dragenter', handleDragEnter);
    header.addEventListener('dragleave', handleDragLeave);
    header.addEventListener('drop', handleTaskDropOnHeader);
  });

  // Make sections droppable and draggable
  taskSections.forEach(section => {
    section.draggable = true;
    section.addEventListener('dragstart', handleSectionDragStart);
    section.addEventListener('dragend', handleSectionDragEnd);
    section.addEventListener('dragover', handleSectionDragOver);
    section.addEventListener('drop', handleSectionDrop);
    
    // Make sections droppable for tasks as well
    section.addEventListener('dragover', handleTaskOverSection);
    section.addEventListener('drop', handleTaskDropOnSection);
  });
  
  // Make the app container droppable for tasks
  if (appContainer) {
    appContainer.addEventListener('dragover', handleTaskOverContainer);
    appContainer.addEventListener('drop', handleTaskDropOnContainer);
  }
}

// Handler functions for section drag and drop
function handleSectionDragStart(e) {
  e.target.classList.add('dragging-section');
  e.dataTransfer.setData('text/plain', 'section');
  e.dataTransfer.effectAllowed = 'move';
}

function handleSectionDragEnd(e) {
  e.target.classList.remove('dragging-section');
  document.querySelectorAll('.task-section').forEach(section => {
    section.classList.remove('drag-over-top');
    section.classList.remove('drag-over-bottom');
  });
}

function handleSectionDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const section = e.currentTarget;
  const draggingSection = document.querySelector('.dragging-section');
  
  if (!draggingSection || draggingSection === section) return;
  
  const rect = section.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  
  // Remove existing drag-over classes
  section.classList.remove('drag-over-top', 'drag-over-bottom');
  
  // Add appropriate drag-over class based on mouse position
  if (e.clientY < midY) {
    section.classList.add('drag-over-top');
  } else {
    section.classList.add('drag-over-bottom');
  }
}

function handleSectionDrop(e) {
  e.preventDefault();
  const section = e.currentTarget;
  const draggingSection = document.querySelector('.dragging-section');
  
  if (!draggingSection || draggingSection === section) return;
  
  const rect = section.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  
  if (e.clientY < midY) {
    section.parentNode.insertBefore(draggingSection, section);
  } else {
    section.parentNode.insertBefore(draggingSection, section.nextSibling);
  }
  
  // Clean up classes
  section.classList.remove('drag-over-top', 'drag-over-bottom');
  
  // Save the new order
  saveTodos();
}

// Update handleDragStart to include task type information
function handleDragStart(e) {
  if (e.target.closest('[contenteditable="true"]:focus')) {
    e.preventDefault();
    return;
  }
  
  draggedItem = e.currentTarget;
  draggedItem.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  
  // Store whether this is a subtask
  draggedItem.dataset.wasSubtask = draggedItem.classList.contains('subtask-item');
}

// Add helper function to determine drop type
function getDropType(e, targetItem) {
  if (!targetItem) return 'list';
  
  const rect = targetItem.getBoundingClientRect();
  const mouseY = e.clientY;
  const threshold = 10; // pixels from bottom to trigger subtask conversion
  
  if (mouseY > rect.bottom - threshold) {
    return 'subtask';
  }
  return 'sibling';
}

// Update handleDragOver to show different indicators
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const taskItem = e.target.closest('.task-item');
  if (taskItem) {
    const dropType = getDropType(e, taskItem);
    
    // Remove all drag indicators
    taskItem.classList.remove('drag-above', 'drag-below', 'drag-as-subtask');
    
    // Add appropriate indicator
    if (dropType === 'subtask') {
      taskItem.classList.add('drag-as-subtask');
    } else if (dropType === 'sibling') {
      const rect = taskItem.getBoundingClientRect();
      const mouseY = e.clientY;
      const midPoint = rect.top + rect.height / 2;
      
      if (mouseY < midPoint) {
        taskItem.classList.add('drag-above');
      } else {
        taskItem.classList.add('drag-below');
      }
    }
  }
}

// Update handleDragEnter to handle drag enter events
function handleDragEnter(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

// Update handleDragLeave to handle drag leave events
function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

// Update handleDrop to handle subtask conversion
function handleDrop(e) {
  e.preventDefault();
  if (!draggedItem) return;
  
  const targetItem = e.target.closest('.task-item');
  const dropZone = e.target.closest('.task-list, .subtask-container');
  
  // Remove all drag indicators
  document.querySelectorAll('.task-item').forEach(item => {
    item.classList.remove('drag-above', 'drag-below', 'drag-as-subtask');
  });
  
  if (targetItem) {
    const dropType = getDropType(e, targetItem);
    
    if (dropType === 'subtask') {
      // Convert to subtask
      let subtaskContainer = targetItem.nextElementSibling;
      
      // Create subtask container if it doesn't exist
      if (!subtaskContainer || !subtaskContainer.classList.contains('subtask-container')) {
        subtaskContainer = document.createElement('div');
        subtaskContainer.className = 'subtask-container';
        targetItem.after(subtaskContainer);
        targetItem.classList.add('has-subtasks');
      }
      
      // Remove from old subtask container if it was a subtask
      if (draggedItem.classList.contains('subtask-item')) {
        const oldContainer = draggedItem.closest('.subtask-container');
        draggedItem.classList.remove('subtask-item');
        draggedItem.remove();
        
        // Clean up empty containers
        if (oldContainer && oldContainer.children.length === 0) {
          const parentTask = oldContainer.previousElementSibling;
          if (parentTask) {
            parentTask.classList.remove('has-subtasks');
          }
          oldContainer.remove();
        }
      }
      
      // Add as subtask
      draggedItem.classList.add('subtask-item');
      subtaskContainer.appendChild(draggedItem);
    } else {
      // Handle normal task positioning
      const rect = targetItem.getBoundingClientRect();
      const mouseY = e.clientY;
      const midPoint = rect.top + rect.height / 2;
      
      if (mouseY < midPoint) {
        targetItem.before(draggedItem);
      } else {
        targetItem.after(draggedItem);
      }
      
      // If it was a subtask before, remove subtask styling
      if (draggedItem.dataset.wasSubtask === 'true') {
        draggedItem.classList.remove('subtask-item');
      }
    }
  } else if (dropZone) {
    // Dropped directly on a list
    dropZone.appendChild(draggedItem);
    
    // If it was a subtask before, remove subtask styling
    if (draggedItem.dataset.wasSubtask === 'true') {
      draggedItem.classList.remove('subtask-item');
    }
  }
  
  // Clean up
  draggedItem.classList.remove('dragging');
  delete draggedItem.dataset.wasSubtask;
  draggedItem = null;
  
  // Save changes
  saveTodos();
}

// Update handleDragEnd to clean up indicators
function handleDragEnd(e) {
  if (draggedItem) {
    draggedItem.classList.remove('dragging');
    draggedItem = null;
  }
  
  // Remove all drag indicators
  document.querySelectorAll('.task-item').forEach(item => {
    item.classList.remove('drag-above', 'drag-below', 'drag-as-subtask');
  });
  
  // Remove section drag-over indicators
  document.querySelectorAll('.task-section').forEach(section => {
    section.classList.remove('task-drag-over');
  });
  
  // Remove header drag-over indicators
  document.querySelectorAll('.task-header').forEach(header => {
    header.classList.remove('header-drag-over');
  });
  
  // Remove task list drag-over indicators
  document.querySelectorAll('.task-list').forEach(list => {
    list.classList.remove('drag-over');
  });
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
  scheduleAutoSave();
}

// Add a new todo
function addTodo() {
  const title = newTodoInput.value.trim();
  const isHeader = document.getElementById('typeToggle').checked;
  
  if (title === '') {
    return; // Don't add empty items
  }
  
  console.log('Adding new todo:', { title, isHeader });
  saveToUndoHistory();
  
  // Create new todo object
  const newTodo = {
    id: Date.now().toString(), // Add unique ID
    title: title,
    isChecked: false,
    isHeader: isHeader
  };
  
  // Add to todos array
  todos.push(newTodo);
  console.log('Updated todos array:', todos);
  
  newTodoInput.value = '';
  saveTodos();
  renderTodoList();
  scheduleAutoSave();
}

// Handle checkbox changes
function handleCheckboxChange(e) {
  saveToUndoHistory();
  const index = parseInt(e.target.dataset.index);
  todos[index].isChecked = e.target.checked;
  saveTodos();
  renderTodoList();
  scheduleAutoSave();
}

// Handle deleting a todo
function handleDeleteTodo(e) {
  saveToUndoHistory();
  const index = parseInt(e.target.dataset.index);
  todos.splice(index, 1);
  saveTodos();
  renderTodoList();
  scheduleAutoSave();
}

// Toggle pin status
async function togglePinStatus() {
  const isPinned = await window.electronAPI.togglePin();
  pinButton.textContent = isPinned ? 'Unpin Window' : 'Pin Window';
}

// Update the showCanvasModal function
async function showCanvasModal() {
  try {
    const storedKey = await window.electronAPI.getStoredCanvasApiKey();
    const storedUrl = await window.electronAPI.getStoredCanvasApiUrl();
    
    if (storedKey) {
      canvasApiKeyInput.value = storedKey;
    }
    
    if (storedUrl) {
      canvasApiUrlInput.value = storedUrl;
      // Set the university select if it matches a known URL
      const universitySelect = document.getElementById('universitySelect');
      const matchingOption = Array.from(universitySelect.options).find(option => option.value === storedUrl);
      if (matchingOption) {
        universitySelect.value = storedUrl;
      } else {
        universitySelect.value = 'custom';
      }
    }
    
    canvasModal.style.display = 'block';
    
    // Use setTimeout to ensure focus works properly on Windows
    setTimeout(() => {
      if (!storedUrl) {
        document.getElementById('universitySelect').focus();
      } else if (!storedKey) {
        canvasApiKeyInput.focus();
      }
    }, 50);
  } catch (error) {
    console.error('Error showing Canvas modal:', error);
    showToast('Error loading Canvas settings');
  }
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
  const apiUrl = canvasApiUrlInput.value.trim();
  
  if (!apiKey) {
    alert('Please enter your Canvas API key');
    return;
  }

  if (!apiUrl) {
    alert('Please enter your Canvas URL');
    return;
  }

  // Validate URL format
  try {
    new URL(apiUrl);
  } catch (error) {
    alert('Please enter a valid Canvas URL (e.g., https://canvas.university.edu)');
    return;
  }

  try {
    const groupedAssignments = await window.electronAPI.fetchCanvasAssignments(apiKey, apiUrl);
    
    // If we got here, the API key and URL were valid, so close the modal and store them
    await window.electronAPI.storeCanvasApiKey(apiKey);
    await window.electronAPI.storeCanvasApiUrl(apiUrl);
    closeCanvasModal();
    
    // Make sure canvasFilters is initialized
    canvasFilters = document.querySelectorAll('.canvas-filter');
    
    // Update course filter dropdown (first filter)
    if (canvasFilters && canvasFilters.length > 0) {
      const courseFilter = canvasFilters[0];
    courseFilter.innerHTML = '<option value="">All Courses</option>';
    Object.values(groupedAssignments).forEach(course => {
      const option = document.createElement('option');
      option.value = course.courseCode;
      option.textContent = course.courseCode;
      courseFilter.appendChild(option);
    });
      console.log(`Added ${Object.keys(groupedAssignments).length} courses to the course filter dropdown`);
    } else {
      console.error('Canvas filters not found for setting up course dropdown');
    }

    displayAssignments(groupedAssignments);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to fetch assignments. Please check your Canvas URL and API key and try again.');
  }
}

// Add this variable to store the original grouped assignments
let originalGroupedAssignments = {};

function displayAssignments(groupedAssignments) {
  console.log('Displaying assignments:', groupedAssignments);
  
  // Clear the current assignments
  assignmentsList.innerHTML = '';
  
  // Save the courses for future filtering
  allCoursesData = groupedAssignments;
  
  // Create a fragment to add all assignments at once for better performance
  const fragment = document.createDocumentFragment();
  
  // Loop through each course and its assignments
  Object.values(groupedAssignments).forEach(course => {
    // Create course header
    const courseHeader = document.createElement('div');
    courseHeader.className = 'course-header';
    courseHeader.innerHTML = `
      <h3>${course.courseCode}</h3>
      <div class="course-name">${course.courseName}</div>
    `;
    
    // Create a group for this course's assignments
    const courseGroup = document.createElement('div');
    courseGroup.className = 'course-group';
    courseGroup.dataset.courseCode = course.courseCode;
    courseGroup.dataset.courseName = course.courseName;
    
    // Add course header to the group
    courseGroup.appendChild(courseHeader);
    
    // Check if there are assignments
    if (course.assignments && course.assignments.length > 0) {
      // Loop through assignments
      course.assignments.forEach(assignment => {
        // Create assignment item
        const assignmentItem = document.createElement('div');
        assignmentItem.className = 'assignment-item';
        assignmentItem.dataset.courseCode = course.courseCode;
        assignmentItem.dataset.courseName = course.courseName;
        assignmentItem.dataset.type = assignment.type || 'assignment';
        assignmentItem.dataset.courseVisible = 'true';  // Initialize all visibility attributes to true
        assignmentItem.dataset.typeVisible = 'true';
        assignmentItem.dataset.pastDueVisible = 'true';
        
        // Check if assignment is past due
        if (assignment.dueDate) {
          const now = new Date();
          try {
            // Handle formatted date strings like "Apr 5 at 11:59pm"
            let dueDate;
            if (assignment.dueDate.includes(' at ')) {
              // Parse formatted date string from Canvas API
              const [datePart, timePart] = assignment.dueDate.split(' at ');
              const [month, day] = datePart.split(' ');
              const months = {"Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, 
                              "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11};
              
              // Create a date object with current year (Canvas API might not include year)
              const year = now.getFullYear();
              dueDate = new Date(year, months[month], parseInt(day));

              // Set the time if available
              if (timePart) {
                let hours = parseInt(timePart.match(/\d+/)[0]);
                const isPM = timePart.toLowerCase().includes('pm');
                const minutes = parseInt(timePart.match(/:(\d+)/)?.[1] || 0);
                
                if (isPM && hours < 12) hours += 12;
                if (!isPM && hours === 12) hours = 0;
                
                dueDate.setHours(hours, minutes);
              }
            } else {
              dueDate = new Date(assignment.dueDate);
            }
            
            assignmentItem.dataset.pastDue = dueDate < now ? 'true' : 'false';
          } catch (error) {
            console.error('Error parsing date:', assignment.dueDate, error);
            assignmentItem.dataset.pastDue = 'false';
          }
        } else {
          assignmentItem.dataset.pastDue = 'false';
        }
        
        // Format assignment HTML
        const formattedDueDate = assignment.dueDate ? formatAssignmentDate(assignment.dueDate) : 'No due date';
        const assignmentType = assignment.type ? assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1) : 'Assignment';
        
        assignmentItem.innerHTML = `
          <div class="assignment-details">
            <div class="assignment-header">
              <div class="assignment-title-row">
                <div class="assignment-title">${assignment.name}</div>
                ${assignment.points ? `<span class="assignment-points">${assignment.points} pts</span>` : ''}
              </div>
            </div>
            <div class="assignment-due">
              <span class="due-absolute">${formattedDueDate}</span>
              <span class="due-relative">${assignment.dueDate ? getRelativeDueDate(assignment.dueDate) : 'No due date'}</span>
              <span class="assignment-type">${assignmentType}</span>
              ${assignment.submissionStatus ? `<span class="submission-status ${assignment.submissionStatus === 'submitted' ? 'submitted' : 'pending'}">${assignment.submissionStatus}</span>` : ''}
            </div>
            <div class="assignment-links">
              ${assignment.htmlUrl ? `<a href="${assignment.htmlUrl}" target="_blank" class="canvas-link">View in Canvas</a>` : ''}
            </div>
          </div>
          <button class="add-assignment-button" data-name="${assignment.name}" data-due-date="${assignment.dueDate || ''}">Add to List</button>
        `;
        
        // Add click event to the "Add to List" button
        const addButton = assignmentItem.querySelector('.add-assignment-button');
        addButton.addEventListener('click', function() {
          const assignmentName = this.dataset.name;
          const dueDateISO = this.dataset.dueDate;
          showAddToHeaderModal(assignmentName, dueDateISO);
        });
        
        // Add the assignment item to the course group
        courseGroup.appendChild(assignmentItem);
      });
    } else {
      // No assignments for this course
      const noAssignments = document.createElement('div');
      noAssignments.className = 'no-assignments';
      noAssignments.textContent = 'No assignments found for this course';
      courseGroup.appendChild(noAssignments);
    }
    
    // Add the course group to the fragment
    fragment.appendChild(courseGroup);
  });
  
  // Add all assignments to the DOM at once
  assignmentsList.appendChild(fragment);
  
  // Apply the past due filter based on the current selection
  const pastDueFilter = document.getElementById('pastDueFilter');
  if (pastDueFilter) {
    applyPastDueFilter(pastDueFilter.value, true);
  }
  
  console.log('Assignments displayed successfully');
  
  // Function to format assignment date
  function formatAssignmentDate(dateStr) {
    try {
      // Check if it's already a formatted string with "at"
      if (dateStr && dateStr.includes(' at ')) {
        // It's already a formatted date string from the Canvas API, return it directly
        return dateStr;
      }
      
      // Otherwise parse and format the date
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr || 'No due date';
    }
  }
}

// New function to regroup assignments by course
function regroupAssignmentsByCourse() {
  console.log('Regrouping assignments by course');
  
  // Save current filter values before clearing the list
  const courseFilter = document.querySelectorAll('.canvas-filter')[0]?.value || '';
  const typeFilter = document.querySelectorAll('.canvas-filter')[1]?.value || '';
  const pastDueFilter = document.getElementById('pastDueFilter')?.value || 'upcoming';
  
  console.log('Current filter states before regrouping:', { courseFilter, typeFilter, pastDueFilter });
  
  // Save all assignment items visibility states before clearing
  const savedItemStates = [];
  const assignmentItems = Array.from(document.querySelectorAll('.assignment-item'));
  
  assignmentItems.forEach(item => {
    savedItemStates.push({
      courseCode: item.dataset.courseCode,
      courseName: item.dataset.courseName,
      type: item.dataset.type,
      pastDue: item.dataset.pastDue,
      pastDueVisible: item.dataset.pastDueVisible,
      name: item.querySelector('.assignment-title')?.textContent,
      isVisible: item.style.display !== 'none',
      // Create a clone of the element to preserve all its content
      element: item.cloneNode(true)
    });
  });
  
  console.log(`Saved ${savedItemStates.length} item states before regrouping`);
  
  // Now clear the assignments list
  // Use the correct ID to match the DOM element
  const assignmentsList = document.getElementById('assignmentsList');
  if (!assignmentsList) {
    console.error('Could not find assignments list element with ID "assignmentsList"');
    return;
  }
  assignmentsList.innerHTML = '';
  
  // Group assignments by course
  const assignmentsByCourse = {};
  savedItemStates.forEach(item => {
    if (!assignmentsByCourse[item.courseCode]) {
      assignmentsByCourse[item.courseCode] = {
        courseCode: item.courseCode,
        courseName: item.courseName,
        assignments: []
      };
    }
    assignmentsByCourse[item.courseCode].assignments.push(item);
  });
  
  console.log(`Created ${Object.keys(assignmentsByCourse).length} courses in regrouping`);
  
  // Add course groups with headers and assignments
  Object.values(assignmentsByCourse).forEach(course => {
    // Skip if we're filtering by course and this isn't the selected course
    if (courseFilter && course.courseCode !== courseFilter) {
      console.log(`Skipping course ${course.courseCode} due to course filter: ${courseFilter}`);
      return;
    }
    
    // Create a course group that will contain both header and assignments
    const courseGroup = document.createElement('div');
    courseGroup.className = 'course-group';
    courseGroup.dataset.courseCode = course.courseCode;
    assignmentsList.appendChild(courseGroup);
    
    // Create the course header
    const courseHeader = document.createElement('div');
    courseHeader.className = 'course-header';
    courseHeader.innerHTML = `
      <h3>${course.courseCode}</h3>
      <div class="course-name">${course.courseName}</div>
    `;
    courseGroup.appendChild(courseHeader);
    
    // Track if this course has any visible assignments
    let hasVisibleAssignments = false;
    
    // Append all assignments for this course
    course.assignments.forEach(itemState => {
      // Create a new item from the cloned element
      const newItem = itemState.element;
      
      // Check if this item should be visible based on filters
      const matchesTypeFilter = !typeFilter || newItem.dataset.type === typeFilter;
      const matchesPastDueFilter = pastDueFilter === 'all' || 
        (pastDueFilter === 'upcoming' && newItem.dataset.pastDue !== 'true') || 
        (pastDueFilter === 'past' && newItem.dataset.pastDue === 'true');
      
      // Update visibility data attributes
      newItem.dataset.courseVisible = 'true'; // We're already filtering by course here
      newItem.dataset.typeVisible = matchesTypeFilter ? 'true' : 'false';
      newItem.dataset.pastDueVisible = matchesPastDueFilter ? 'true' : 'false';
      
      // Determine if it should be visible
      const isVisible = matchesTypeFilter && matchesPastDueFilter;
      if (isVisible) {
        hasVisibleAssignments = true;
        newItem.style.display = 'flex';
      } else {
        newItem.style.display = 'none';
      }
      
      // Add the item to the course group
      courseGroup.appendChild(newItem);
    });
    
    // Hide course group if no visible assignments
    if (!hasVisibleAssignments) {
      courseGroup.style.display = 'none';
    }
  });
  
  console.log('Regrouping complete');
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
      case 'move-to-list':
        showMoveTaskModal(contextMenuTarget);
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

// Helper function to parse relative due date text 
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
  taskText.textContent = `${baseText} (Due: ${newDate})`;
  
  saveTodos();
  showToast('Due date updated');
  scheduleAutoSave();
}

// Initialize the app
function initializeApp() {
  // Add CSS for smooth transitions
  const style = document.createElement('style');
  style.textContent = `
    .section-content {
      transition: height 0.3s ease;
    }
    .task-list {
      transition: height 0.3s ease;
    }
    .task-caret, .toggle-section-btn i {
      transition: transform 0.3s ease;
    }
  `;
  document.head.appendChild(style);

  // Initialize collapsible sections
  initializeCollapsibleSections();

  // Load todos
  loadTodos();

  // Set up event listeners
  setupEventListeners();
  setupDragAndDrop();
  setupContextMenu();

  // Initialize Canvas filters
  initializeCanvasFilters();

  // Update productivity stats
  updateProductivityStats();

  // Set up periodic updates for relative dates (every minute)
  setInterval(updateRelativeDates, 60000);

  // Show welcome screen for first-time users
  window.electronAPI.isDevelopment().then(isDev => {
    if (isDev) {
      const welcomeTestButton = document.getElementById('welcomeTestButton');
      if (welcomeTestButton) {
        welcomeTestButton.style.display = 'block';
        welcomeTestButton.addEventListener('click', showWelcomeScreen);
      }
    }
  });
}

// Add this function to initialize canvas filters
function initializeCanvasFilters() {
  // Initialize canvasFilters
  canvasFilters = document.querySelectorAll('.canvas-filter');
  console.log(`Found ${canvasFilters.length} canvas filters`);
  
  if (!canvasFilters || canvasFilters.length === 0) {
    console.log('No canvas filters found');
    return;
  }

  canvasFilters.forEach((filter, index) => {
    filter.addEventListener('change', () => {
      console.log(`Canvas filter ${index} changed to: ${filter.value}`);
      
      if (index === 0) { // Course filter
        const selectedCourse = filter.value;
        console.log('Applying course filter:', selectedCourse);
        
        // For debugging, check all assignment items and their course codes
        const allItems = document.querySelectorAll('.assignment-item');
        console.log(`Found ${allItems.length} assignment items before filtering`);
        
        // Instead of regrouping, just update visibility of items
        allItems.forEach(item => {
          // For course filter, directly set visibility based on course match
          if (selectedCourse) {
            const matchesCourse = item.dataset.courseCode === selectedCourse;
            console.log(`Item "${item.querySelector('.assignment-title')?.textContent}" with course ${item.dataset.courseCode} - matches selected course: ${matchesCourse}`);
            item.dataset.courseVisible = matchesCourse ? 'true' : 'false';
          } else {
            // No course filter selected, make all items visible
            item.dataset.courseVisible = 'true';
          }
          
          // Now apply all filters
          updateItemVisibility(item);
        });
        
        // Update course group visibility
        updateAllCourseGroupsVisibility();
      }
      else if (index === 1) { // Type filter
        const selectedType = filter.value;
        console.log('Applying type filter:', selectedType);
        
        const assignmentItems = document.querySelectorAll('.assignment-item');
        assignmentItems.forEach(item => {
          // Similar to course filter, set a data attribute for type visibility
          if (selectedType) {
            const matchesType = item.dataset.type === selectedType;
            item.dataset.typeVisible = matchesType ? 'true' : 'false';
          } else {
            // No type filter selected, make all items visible by type
            item.dataset.typeVisible = 'true';
          }
          
          // Apply all filters
          updateItemVisibility(item);
        });
        
        // Update course group visibility
        updateAllCourseGroupsVisibility();
      }
      // removed due date sort filter handling
    });
  });

  // Initialize past due filter listener
  const pastDueFilter = document.getElementById('pastDueFilter');
  if (pastDueFilter) {
    pastDueFilter.addEventListener('change', () => {
      const selectedValue = pastDueFilter.value;
      console.log('Past due filter changed to:', selectedValue);
      
      // Validate the filter value
      if (!['upcoming', 'past', 'all'].includes(selectedValue)) {
        console.warn(`Invalid past due filter value: ${selectedValue}, defaulting to 'upcoming'`);
        pastDueFilter.value = 'upcoming';
        applyPastDueFilter('upcoming', true);
      } else {
        applyPastDueFilter(selectedValue, true);
      }
      
      // Update course group visibility
      updateAllCourseGroupsVisibility();
    });
  } else {
    console.log('Past due filter not found in the DOM');
  }
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

// Update last synced time
function updateLastSyncedTime() {
  const lastSyncedElement = document.getElementById('lastSynced');
  if (!lastSyncedElement) return;
  
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  lastSyncedElement.textContent = `Last synced: ${timeString}`;
}

// Update streak count and message
async function updateStreak() {
  // Get current streak from storage
  let streak = await window.electronAPI.getStreak();
  const lastVisit = await window.electronAPI.getLastVisit();
  const today = new Date().toDateString();
  
  if (lastVisit === today) {
    // Already visited today, keep current streak
  } else if (lastVisit === new Date(Date.now() - 86400000).toDateString()) {
    // Visited yesterday, increment streak
    streak++;
    await window.electronAPI.setStreak(streak);
  } else if (lastVisit) {
    // Missed a day, reset streak to 0
    streak = 0;
    await window.electronAPI.setStreak(streak);
  } else {
    // First visit
    streak = 1;
    await window.electronAPI.setStreak(streak);
  }
  
  // Update last visit
  await window.electronAPI.setLastVisit(today);
  
  // Update streak display
  const streakCountEl = document.getElementById('streakCount');
  const streakMessageEl = document.getElementById('streakMessage');
  const streakBarEl = document.getElementById('streakBar');
  
  if (streakCountEl) {
    streakCountEl.textContent = `${streak} Day${streak !== 1 ? 's' : ''} Streak`;
  }
  
  if (streakMessageEl) {
    streakMessageEl.textContent = getStreakMessage(streak);
  }

  // Update streak progress bar
  if (streakBarEl) {
    // Define the ranges
    const ranges = [
      { min: 0, max: 10 },
      { min: 10, max: 20 },
      { min: 20, max: 50 },
      { min: 50, max: 100 }
    ];
    
    // Find current range
    const currentRange = ranges.find(range => streak < range.max) || ranges[ranges.length - 1];
    
    // Calculate progress percentage within the current range
    let progress;
    if (streak >= 100) {
      progress = 100;
    } else {
      progress = ((streak - currentRange.min) / (currentRange.max - currentRange.min)) * 100;
    }
    
    // Smooth transition for the progress bar
    streakBarEl.style.transition = 'width 0.5s ease-in-out';
    streakBarEl.style.width = `${progress}%`;
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

// Add this function to handle university selection
function handleUniversitySelect(e) {
  const selectedValue = e.target.value;
  const canvasApiUrlInput = document.getElementById('canvasApiUrl');
  
  if (selectedValue === 'custom') {
    canvasApiUrlInput.value = '';
    canvasApiUrlInput.removeAttribute('readonly');
    canvasApiUrlInput.focus();
  } else if (selectedValue) {
    canvasApiUrlInput.value = selectedValue;
    canvasApiUrlInput.setAttribute('readonly', true);
  } else {
    canvasApiUrlInput.value = '';
    canvasApiUrlInput.removeAttribute('readonly');
  }
}

// Add these new functions
function initializeCollapsibleSections() {
  // Load saved states
  const savedStates = window.api.store.get('collapsedSections') || {};
  
  sectionHeaders.forEach((header, index) => {
    const section = header.closest('.add-task-section, .canvas-section, .stats-section');
    const content = section.querySelector('.section-content');
    const toggleBtn = header.querySelector('.toggle-section-btn i');
    
    // Set initial state from saved state
    const sectionId = section.classList.contains('add-task-section') ? 'addTask' :
                     section.classList.contains('canvas-section') ? 'canvas' : 'stats';
    
    if (savedStates[sectionId]) {
      content.classList.add('collapsed');
      content.style.height = '0px'; // Set initial height for animation later
      toggleBtn.style.transform = 'rotate(-90deg)';
      toggleBtn.style.transition = 'transform 0.3s ease';
    } else {
      // Make sure transform is set for future animations
      toggleBtn.style.transform = 'rotate(0deg)';
      toggleBtn.style.transition = 'transform 0.3s ease';
    }
    
    // Add click handler
    header.addEventListener('click', () => toggleSection(section, content, toggleBtn, sectionId));
  });
}

function toggleSection(section, content, toggleBtn, sectionId) {
  const isCollapsed = content.classList.contains('collapsed');
  
  // Add animation classes
  if (isCollapsed) {
    // We're expanding
    content.style.height = '0px';
    content.style.overflow = 'hidden';
    content.classList.remove('collapsed');
    
    // Force a reflow to ensure the transition happens
    void content.offsetWidth;
    
    // Set the height to the scrollHeight to animate to full height
    content.style.height = content.scrollHeight + 'px';
    
    // Rotate icon with transition
    toggleBtn.style.transform = 'rotate(0deg)';
    toggleBtn.style.transition = 'transform 0.3s ease';
    
    // Remove height and overflow constraints after animation completes
    setTimeout(() => {
      content.style.height = '';
      content.style.overflow = '';
    }, 300); // Match duration with CSS transition
  } else {
    // We're collapsing
    // Set initial height before animation
    content.style.height = content.scrollHeight + 'px';
    content.style.overflow = 'hidden';
    
    // Force a reflow to ensure the transition happens
    void content.offsetWidth;
    
    // Animate to height 0
    content.style.height = '0px';
    
    // Rotate icon with transition
    toggleBtn.style.transform = 'rotate(-90deg)';
    toggleBtn.style.transition = 'transform 0.3s ease';
    
    // Add collapsed class and clean up styles after animation
    setTimeout(() => {
      content.classList.add('collapsed');
      // Only keep height at 0 but remove overflow constraint
      content.style.overflow = '';
    }, 300); // Match duration with CSS transition
  }
  
  // Save state
  const savedStates = window.api.store.get('collapsedSections') || {};
  savedStates[sectionId] = !isCollapsed;
  window.api.store.set('collapsedSections', savedStates);
}

// Add this function to apply the past due filter
function applyPastDueFilter(filterValue, updateDisplay = true) {
  console.log(`Applying past due filter: ${filterValue}, updateDisplay: ${updateDisplay}`);
  
  // Ensure filterValue is one of the expected values
  if (!['upcoming', 'past', 'all'].includes(filterValue)) {
    console.warn(`Invalid past due filter value: ${filterValue}, defaulting to 'upcoming'`);
    filterValue = 'upcoming';
  }
  
  const assignmentItems = document.querySelectorAll('.assignment-item');
  if (!assignmentItems.length) {
    console.warn('No assignment items found for pastDueFilter');
    return;
  }
  
  console.log(`Found ${assignmentItems.length} assignment items to apply past due filter to`);
  
  // Update the data attribute for past due visibility on all items
  assignmentItems.forEach(item => {
    const isPastDue = item.dataset.pastDue === 'true';
    const itemTitle = item.querySelector('.assignment-title')?.textContent || 'Unknown';
    console.log(`Item "${itemTitle}": isPastDue=${isPastDue}`);
    
    // Set the pastDueVisible attribute based on filter value
    if (filterValue === 'upcoming') {
      // Only upcoming assignments are visible
      item.dataset.pastDueVisible = !isPastDue ? 'true' : 'false';
    } else if (filterValue === 'past') {
      // Only past due assignments are visible
      item.dataset.pastDueVisible = isPastDue ? 'true' : 'false';
    } else { // 'all'
      // All assignments are visible
      item.dataset.pastDueVisible = 'true';
    }
    
    console.log(`Set pastDueVisible=${item.dataset.pastDueVisible} for item "${itemTitle}"`);
    
    // Only update the display if requested
    if (updateDisplay) {
      updateItemVisibility(item);
    }
  });
  
  // Update course group visibility if requested
  if (updateDisplay) {
    updateAllCourseGroupsVisibility();
  }
}

// New helper function to determine if an item should be visible based on all active filters
function updateItemVisibility(item) {
  if (!item) {
    console.log('Cannot update visibility of undefined item');
    return;
  }
  
  try {
    // Get visibility from the data attributes
    const courseVisible = item.dataset.courseVisible !== 'false';  // Default to true if not set
    const typeVisible = item.dataset.typeVisible !== 'false';      // Default to true if not set
    const pastDueVisible = item.dataset.pastDueVisible !== 'false'; // Default to true if not set
    
    // Log the visibility values for debugging
    const itemTitle = item.querySelector('.assignment-title')?.textContent || 'Unknown item';
    console.log(`Item visibility for "${itemTitle}":`, {
      courseVisible,
      courseCode: item.dataset.courseCode,
      typeVisible,
      itemType: item.dataset.type,
      pastDueVisible,
      rawPastDueVisible: item.dataset.pastDueVisible
    });
    
    // Item is visible only if it passes ALL active filters
    const isVisible = courseVisible && typeVisible && pastDueVisible;
    
    // Apply visibility
    item.style.display = isVisible ? 'flex' : 'none';
    
    // Update the course group visibility if needed
    updateCourseGroupVisibility(item.closest('.course-group'));
    
    console.log(`Setting item "${itemTitle}" display to: ${isVisible ? 'flex' : 'none'}`);
  } catch (error) {
    console.error('Error updating item visibility:', error);
  }
}

// New helper function to update course group visibility
function updateCourseGroupVisibility(courseGroup) {
  if (!courseGroup) return;
  
  const courseCode = courseGroup.dataset.courseCode;
  const assignmentItems = Array.from(courseGroup.querySelectorAll('.assignment-item'));
  const visibleItems = assignmentItems.filter(item => item.style.display !== 'none');
  
  // Show the course group if it has visible items, hide it otherwise
  courseGroup.style.display = visibleItems.length > 0 ? 'block' : 'none';
  
  console.log(`Course group ${courseCode}: ${visibleItems.length} visible items out of ${assignmentItems.length}`);
}

// New helper function to update all course group visibility
function updateAllCourseGroupsVisibility() {
  const courseGroups = document.querySelectorAll('.course-group');
  courseGroups.forEach(updateCourseGroupVisibility);
}

function addAssignmentToTasks(name, dueDate, newHeaderName = null) {
  console.log('addAssignmentToTasks called with:', { name, dueDate, newHeaderName });
  
  let selectedHeaderText = '';
  
  // If a new header name is provided, create it
  if (newHeaderName) {
    const taskSection = handleCreateHeader(newHeaderName);
    selectedHeaderText = newHeaderName;
  } else {
    // Get the selected header from the dropdown
    const headerSelect = document.getElementById('headerSelect');
    if (!headerSelect) {
      console.error('Header select dropdown not found');
      return;
    }
    
    if (headerSelect.value === 'new-header') {
      console.error('New header selected but no name provided');
      return;
    }
    
    selectedHeaderText = headerSelect.options[headerSelect.selectedIndex].text;
  }
  
  console.log('Selected/Created header:', selectedHeaderText);
  
  // Find the target task list based on selected header
  let targetTaskList = null;
  const taskSections = document.querySelectorAll('.task-section');
  
  for (const section of taskSections) {
    const headerTitle = section.querySelector('.task-title');
    if (headerTitle && headerTitle.textContent === selectedHeaderText) {
      targetTaskList = section.querySelector('.task-list');
      break;
    }
  }
  
  if (!targetTaskList) {
    console.error('Target task list not found for header:', selectedHeaderText);
    // Default to the first task list
    targetTaskList = document.querySelector('.task-section:first-of-type .task-list');
    if (!targetTaskList) {
      showToast('Error: Could not find a task list to add to');
      return;
    }
  }
  
  // Create the task item directly
  const taskItem = document.createElement('div');
  taskItem.className = 'task-item';
  taskItem.draggable = true;
  
  // Assign a unique ID to the task
  const taskId = Date.now().toString();
  taskItem.dataset.id = taskId;
  
  // Format the task text with due date
  const displayText = `${name} (Due: ${dueDate})`;
  
  // Get the relative due date
  const relativeDueDate = getRelativeDueDate(dueDate);
  
  // Set task HTML
  taskItem.innerHTML = `
    <div class="drag-handle">⋮⋮</div>
    <input type="checkbox" class="task-checkbox">
    <span class="task-text" contenteditable="true" spellcheck="false">${displayText}</span>
    <div class="task-metadata">
      <span class="due-relative">${relativeDueDate}</span>
      <button class="priority-badge priority-high">High</button>
    </div>
    <button class="delete-button">✕</button>
  `;
  
  // Add the task to the target list
  targetTaskList.appendChild(taskItem);
  
  // Set up event listeners for the new task
  setupTaskEventListeners(taskItem);
  
  // Update task counts and save
  updateTaskCounts();
  saveTodos();
  
  showToast(`Assignment added to ${selectedHeaderText}`);
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

// Get the start of the current week (Sunday)
function getWeekStart() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

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
    taskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addNewTask();
      }
    });
    
    // Ensure input is properly focused on Windows
    taskInput.addEventListener('focus', (e) => {
      // This helps with focus issues on Windows
      setTimeout(() => {
        if (document.activeElement !== taskInput) {
          taskInput.focus();
        }
      }, 0);
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
      taskNotesModal.style.display = 'none'; 
      tutorialModal.style.display = 'none'; // Also close tutorial modal
      const addToHeaderModal = document.getElementById('addToHeaderModal');
      if (addToHeaderModal) {
        addToHeaderModal.style.display = 'none';
      }
    });
  });

  // Save notes button
  if (saveNotesButton) {
    saveNotesButton.addEventListener('click', saveTaskNotes);
  }

  // Task notes input Enter key
  if (taskNotesInput) {
    taskNotesInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        saveTaskNotes();
      }
    });
  }

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === createHeaderModal) {
      createHeaderModal.style.display = 'none';
    }
    if (e.target === taskNotesModal) {
      taskNotesModal.style.display = 'none';
    }
    if (e.target === tutorialModal) {
      tutorialModal.style.display = 'none';
    }
    if (e.target === document.getElementById('addToHeaderModal')) {
      document.getElementById('addToHeaderModal').style.display = 'none';
    }
    if (e.target === document.getElementById('moveTaskModal')) {
      document.getElementById('moveTaskModal').style.display = 'none';
    }
  });

  // Add escape key handler for modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (createHeaderModal.style.display === 'block') {
        createHeaderModal.style.display = 'none';
      }
      if (taskNotesModal.style.display === 'block') {
        taskNotesModal.style.display = 'none';
      }
      if (tutorialModal.style.display === 'block') {
        tutorialModal.style.display = 'none';
      }
      if (document.getElementById('addToHeaderModal')?.style.display === 'block') {
        document.getElementById('addToHeaderModal').style.display = 'none';
      }
      if (document.getElementById('moveTaskModal')?.style.display === 'block') {
        document.getElementById('moveTaskModal').style.display = 'none';
      }
    }
  });

  // Handle Enter key in header name input
  if (headerNameInput) {
    headerNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCreateHeader();
      }
    });
    
    // Ensure input is properly focused on Windows
    headerNameInput.addEventListener('focus', (e) => {
      // This helps with focus issues on Windows
      setTimeout(() => {
        if (document.activeElement !== headerNameInput) {
          headerNameInput.focus();
        }
      }, 0);
    });
  }
  
  // Add event listener for canvas links and add assignment buttons
  assignmentsList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('canvas-link')) {
      e.preventDefault();
      const url = e.target.href || e.target.dataset.url;
      if (url) {
        await window.electronAPI.openExternalLink(url);
      } else {
        // Fallback to normal link behavior if no URL is found
        window.open(e.target.href, '_blank');
      }
    }
    if (e.target.classList.contains('add-assignment-button')) {
      const button = e.target;
      const name = button.dataset.name;
      const dueDate = button.dataset.due;
      
      console.log('Add to List button clicked:', { 
        name, 
        dueDate, 
        course: button.dataset.course,
        type: button.dataset.type
      });
      
      // If the name or dueDate is missing, try to find it from the assignment item
      if (!name || !dueDate) {
        const assignmentItem = button.closest('.assignment-item');
        if (assignmentItem) {
          const nameElement = assignmentItem.querySelector('.assignment-title');
          const dueDateElement = assignmentItem.querySelector('.due-relative');
          
          if (nameElement && !name) {
            name = nameElement.textContent.trim();
          }
          
          if (dueDateElement && !dueDate) {
            dueDate = dueDateElement.textContent.trim();
          }
          
          console.log('Data retrieved from assignment item:', { name, dueDate });
        }
      }
      
      if (name && dueDate) {
        showAddToHeaderModal(name, dueDate);
      } else {
        console.error('Missing assignment data:', { name, dueDate });
        showToast('Error: Could not retrieve assignment details');
      }
    }
  });

  // Add event delegation for priority badges
  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('priority-badge')) {
      handlePriorityChange(e);
    }
  });
  
  // Add event listener for Canvas API key input
  if (canvasApiKeyInput) {
    canvasApiKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        fetchCanvasAssignments();
      }
    });
  }

  // Add university select event listener
  const universitySelect = document.getElementById('universitySelect');
  if (universitySelect) {
    universitySelect.addEventListener('change', handleUniversitySelect);
  }
  
  // Add tutorial button event listener
  if (showTutorialBtn) {
    showTutorialBtn.addEventListener('click', showTutorialModal);
    console.log('Tutorial button event listener added');
  } else {
    console.error('Tutorial button element not found');
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
  const caret = header.querySelector('.task-caret');
  
  // Check if the taskList is currently visible
  const isVisible = taskList.style.display !== 'none' && taskList.style.display !== '';
  
  if (!isVisible) {
    // We're opening the section
    // First set the height to 0 but make it visible
    taskList.style.display = 'block';
    taskList.style.height = '0px';
    taskList.style.overflow = 'hidden';
    
    // Force reflow
    void taskList.offsetWidth;
    
    // Then animate to full height
    taskList.style.height = taskList.scrollHeight + 'px';
    
    // Rotate caret if it exists
    if (caret) {
      caret.style.transform = 'rotate(0deg)';
      caret.style.transition = 'transform 0.3s ease';
    }
    
    // Clean up after animation
    setTimeout(() => {
      taskList.style.height = '';
      taskList.style.overflow = '';
    }, 300);
  } else {
    // We're closing the section
    // Set the initial height
    taskList.style.height = taskList.scrollHeight + 'px';
    taskList.style.overflow = 'hidden';
    
    // Force reflow
    void taskList.offsetWidth;
    
    // Animate to 0 height
    taskList.style.height = '0px';
    
    // Rotate caret if it exists
    if (caret) {
      caret.style.transform = 'rotate(-90deg)';
      caret.style.transition = 'transform 0.3s ease';
    }
    
    // Hide after animation
    setTimeout(() => {
    taskList.style.display = 'none';
      taskList.style.height = '';
      taskList.style.overflow = '';
    }, 300);
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
  const notes = document.querySelector('.task-notes-input')?.value.trim() || '';
  
  // Create new task element
  const taskItem = document.createElement('div');
  taskItem.className = 'task-item';
  taskItem.draggable = true;
  
  // Assign a unique ID to the task
  const taskId = Date.now().toString();
  taskItem.dataset.id = taskId;
  
  // Store notes if they exist
  if (notes) {
    taskNotes[taskId] = notes;
  }
  
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
      ${notes ? '<span class="notes-indicator" title="This task has notes"><i class="fas fa-sticky-note"></i></span>' : ''}
    </div>
    <button class="delete-button">✕</button>
  `;
  
  // Clear input fields
  taskInput.value = '';
  if (dateInput) dateInput.value = '';
  document.querySelector('.task-notes-input').value = '';
  
  // Ensure taskInput gets focus back (important for Windows)
  setTimeout(() => {
    taskInput.focus();
  }, 0);
  
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

// Handle task deletion
function handleDeleteTask(e) {
  e.stopPropagation(); // Prevent event bubbling
  const taskItem = e.target.closest('.task-item');
  if (!taskItem) return;

  // Save to undo history before deleting
  saveToUndoHistory();

  // Check if the task was completed before deletion
  const checkbox = taskItem.querySelector('.task-checkbox');
  const taskText = taskItem.querySelector('.task-text').textContent;
  
  // If the task was completed when deleted, make sure it stays in the history
  if (checkbox && checkbox.checked) {
    // Check if it's already in history to avoid duplicates
    const existingTask = completedTasksHistory.find(task => task.text === taskText);
    if (!existingTask) {
      completedTasksHistory.push({
        text: taskText,
        completedAt: new Date()
      });
    }
  }

  // Remove the task element
  taskItem.remove();

  // Update UI
    updateTaskCounts();
  updateProductivityStats();
  saveTodos();
  
  showToast('Task deleted');
  scheduleAutoSave();
}

// Handle header editing
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
  scheduleAutoSave();
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

// Show toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.opacity = '1';
  
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 3000);
}

// Handle priority change
function handlePriorityChange(e) {
  const badge = e.target.classList.contains('priority-badge') ? e.target : e.currentTarget;
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
  scheduleAutoSave();
}

// Show create header modal
function showCreateHeaderModal() {
  createHeaderModal.style.display = 'block';
  headerNameInput.value = '';
  
  // Use setTimeout to ensure focus works properly on Windows
  setTimeout(() => {
    headerNameInput.focus();
  }, 50);
}

// Update handleCreateHeader to include drag functionality
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
  taskSection.draggable = true;
  taskSection.innerHTML = `
    <div class="task-header">
      <div class="task-header-left">
        <i class="fas fa-grip-vertical drag-handle" style="margin-right: 10px; cursor: grab;"></i>
        <i class="fas fa-chevron-down task-caret" style="margin-right: 5px; transition: transform 0.3s ease;"></i>
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

  // Add drag and drop listeners for the section itself
  taskSection.addEventListener('dragstart', handleSectionDragStart);
  taskSection.addEventListener('dragend', handleSectionDragEnd);
  taskSection.addEventListener('dragover', handleSectionDragOver);
  taskSection.addEventListener('drop', handleSectionDrop);
  
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

// Setup event listeners for task items
function setupTaskEventListeners(taskItem) {
  // Get task elements
  const taskCheckbox = taskItem.querySelector('.task-checkbox');
  const taskText = taskItem.querySelector('.task-text');
  const deleteButton = taskItem.querySelector('.delete-button');
  const priorityBadge = taskItem.querySelector('.priority-badge');
  const dragHandle = taskItem.querySelector('.drag-handle');
  const notesIndicator = taskItem.querySelector('.notes-indicator');
  
  // Add drag and drop listeners
  taskItem.addEventListener('dragstart', handleDragStart);
  taskItem.addEventListener('dragend', handleDragEnd);

  // Add right-click context menu
  taskItem.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    
    // Set the context menu target
    contextMenuTarget = taskItem;
    
    // Position the context menu
    taskContextMenu.style.top = `${e.pageY}px`;
    taskContextMenu.style.left = `${e.pageX}px`;
    taskContextMenu.style.display = 'block';
  });
  
  // Add task checkbox event
  if (taskCheckbox) {
    taskCheckbox.addEventListener('change', handleTaskCompletion);
  }
  
  // Add task text edit events
  if (taskText) {
    taskText.addEventListener('blur', handleTaskEdit);
    taskText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        taskText.blur();
      }
    });
  }
  
  // Add delete button event
  if (deleteButton) {
    deleteButton.addEventListener('click', handleDeleteTask);
  }
  
  // Add priority badge event
  if (priorityBadge) {
    priorityBadge.addEventListener('click', handlePriorityChange);
  }

  // Add notes indicator click event
  if (notesIndicator) {
    notesIndicator.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling to parent elements
      currentTaskItem = taskItem;
      openTaskNotes(taskItem);
    });
  }
}

// Function to open task notes
function openTaskNotes(taskItem) {
  const taskId = taskItem.dataset.id;
  const taskTitle = taskItem.querySelector('.task-text').textContent;
  
  taskTitleDisplay.textContent = taskTitle;
  taskNotesInput.value = taskNotes[taskId] || '';
  
  currentTaskItem = taskItem;
  taskNotesModal.style.display = 'block';
  taskNotesInput.focus();
}

// Save task notes
function saveTaskNotes() {
  if (!currentTaskItem) return;
  
    const taskId = currentTaskItem.dataset.id;
    const notes = taskNotesInput.value.trim();
  
  if (notes) {
    taskNotes[taskId] = notes;
    
    // Add or update notes indicator
    let notesIndicator = currentTaskItem.querySelector('.notes-indicator');
      if (!notesIndicator) {
      const metadata = currentTaskItem.querySelector('.task-metadata');
        notesIndicator = document.createElement('span');
        notesIndicator.className = 'notes-indicator';
        notesIndicator.title = 'This task has notes';
        notesIndicator.innerHTML = '<i class="fas fa-sticky-note"></i>';
        metadata.appendChild(notesIndicator);
      }
    } else {
    // Remove notes if empty
    delete taskNotes[taskId];
    const notesIndicator = currentTaskItem.querySelector('.notes-indicator');
      if (notesIndicator) {
        notesIndicator.remove();
      }
    }
    
    saveTodos();
    taskNotesModal.style.display = 'none';
  showToast('Notes saved');
}

// Helper function to get relative due date text 
function getRelativeDueDate(dateStr) {
  let dueDate;
  const now = new Date();
  
  try {
    // Handle formatted date strings like "Apr 5 at 11:59pm"
    if (typeof dateStr === 'string' && dateStr.includes(' at ')) {
      // Parse formatted date string from Canvas API
      const [datePart, timePart] = dateStr.split(' at ');
      const [month, day] = datePart.split(' ');
      const months = {"Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, 
                      "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11};
      
      // Create a date object with current year (Canvas API might not include year)
      const year = now.getFullYear();
      dueDate = new Date(year, months[month], parseInt(day));

      // Set the time if available
      if (timePart) {
        let hours = parseInt(timePart.match(/\d+/)[0]);
        const isPM = timePart.toLowerCase().includes('pm');
        const minutes = parseInt(timePart.match(/:(\d+)/)?.[1] || 0);
        
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        
        dueDate.setHours(hours, minutes);
      }
    } else {
      dueDate = new Date(dateStr);
    }
  } catch (error) {
    console.error('Error parsing date in getRelativeDueDate:', dateStr, error);
    return '';
  }
  
  // Invalid date returns empty string
  if (isNaN(dueDate.getTime())) {
    return '';
  }
  
  // Calculate difference in days
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Format the relative date text
  if (diffDays === 0) {
    // Check if it's today
    return 'today';
  } else if (diffDays === 1) {
    return 'tomorrow';
  } else if (diffDays === -1) {
    return 'yesterday';
  } else if (diffDays > 1) {
    // Always display in days for future dates
    return `in ${diffDays} days`;
  } else if (diffDays < 0) {
    // Always display in days for past dates
    return `${Math.abs(diffDays)} days ago`;
  }
  
  return '';
}

// Create modal if it doesn't exist
if (!document.getElementById('addToHeaderModal')) {
  const modalHtml = `
    <div id="addToHeaderModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add to Task List</h3>
          <button class="close-button" onclick="document.getElementById('addToHeaderModal').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
          <div class="option-group">
            <div class="option-item">
              <input type="radio" id="addToExisting" name="headerChoice" checked>
              <label for="addToExisting">Add to existing list</label>
              <div class="select-wrapper">
                <select id="headerSelect" class="header-select">
                  <option value="">Choose a list...</option>
                </select>
              </div>
            </div>
            <div class="option-item">
              <input type="radio" id="createNew" name="headerChoice">
              <label for="createNew">Create new list</label>
              <input type="text" id="newHeaderInput" class="header-input" placeholder="Enter list name">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button onclick="confirmAddToHeader()" class="add-button">ADD TASK</button>
          <button onclick="document.getElementById('addToHeaderModal').style.display='none'" class="cancel-button">CANCEL</button>
        </div>
      </div>
    </div>
  `;
  
  const modalStyle = document.createElement('style');
  modalStyle.textContent = `
    #addToHeaderModal {
      background-color: var(--modal-background);
      backdrop-filter: blur(4px);
    }
    
    #addToHeaderModal .modal-content {
      background-color: var(--card-background, #ffffff);
      border-radius: 12px;
      padding: 0;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    }
    
    .dark-theme #addToHeaderModal .modal-content {
      background-color: #1f2937;
    }
    
    .modal-header {
      padding: 20px;
      border-bottom: none; /* Removed border */
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .modal-header h3 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text-color, #1f2937);
      font-weight: 600;
    }
    
    .close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-color, #1f2937);
      cursor: pointer;
      padding: 0;
      opacity: 0.7;
    }
    
    .close-button:hover {
      opacity: 1;
    }
    
    .modal-body {
      padding: 25px 20px;
      border-bottom: none; /* Ensured no border */
    }
    
    .option-group {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .option-item {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px;
      border-radius: 10px;
      background: var(--surface-a5, #f3f4f6);
    }
    
    .dark-theme .option-item {
      background: var(--surface-a10, #374151);
    }
    
    /* Custom radio button styling */
    .option-item input[type="radio"] {
      display: none;
    }
    
    .option-item label {
      font-weight: 500;
      color: var(--text-color, #1f2937);
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      user-select: none;
    }
    
    .option-item label::before {
      content: '';
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid var(--border-color, #d1d5db);
      border-radius: 50%;
      transition: all 0.2s ease;
      background-color: transparent;
    }
    
    .option-item input[type="radio"]:checked + label::before {
      background-color: var(--primary-color, #a78bfa);
      border-color: var(--primary-color, #a78bfa);
      box-shadow: inset 0 0 0 4px var(--background-color, #ffffff);
    }
    
    .dark-theme .option-item input[type="radio"]:checked + label::before {
      box-shadow: inset 0 0 0 4px var(--card-background, #1f2937);
    }
    
    .select-wrapper {
      position: relative;
      width: 100%;
    }
    
    .select-wrapper::after {
      content: '\\25BC';
      position: absolute;
      top: 50%;
      right: 15px;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--text-secondary, #6b7280);
      font-size: 0.8rem;
    }
    
    .header-select, .header-input {
      width: 100%;
      padding: 12px;
      padding-right: 30px;
      border-radius: 8px;
      border: 1px solid var(--border-color, #e5e7eb);
      background: var(--background-color, #ffffff);
      color: var(--text-color, #1f2937);
      font-size: 1rem;
      margin-top: 5px;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
    }
    
    .dark-theme .header-select, 
    .dark-theme .header-input {
      background: var(--surface-a30, #4b5563);
      border-color: var(--surface-a20, #4b5563);
      color: var(--text-color, #f3f4f6);
    }
    
    .header-select:focus, .header-input:focus {
      outline: none;
      border-color: var(--primary-color, #a78bfa);
      box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.2);
    }
    
    .modal-footer {
      padding: 20px;
      border-top: none; /* Removed border */
      display: flex;
      justify-content: flex-end;
      gap: 15px;
    }
    
    .add-button, .cancel-button {
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .add-button {
      background: var(--primary-color, #a78bfa);
      color: white;
    }
    
    .add-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .cancel-button {
      background: var(--surface-a10, #e5e7eb);
      color: var(--text-color, #1f2937);
    }
    
    .dark-theme .cancel-button {
      background: var(--surface-a20, #4b5563);
      color: var(--text-color, #f3f4f6);
    }
    
    .cancel-button:hover {
      background: var(--surface-a20, #d1d5db);
    }
  `;
  document.head.appendChild(modalStyle);
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Add event listeners for radio buttons to toggle inputs
  document.getElementById('addToExisting').addEventListener('change', function() {
    document.getElementById('headerSelect').disabled = !this.checked;
    document.getElementById('newHeaderInput').disabled = this.checked;
  });
  
  document.getElementById('createNew').addEventListener('change', function() {
    document.getElementById('headerSelect').disabled = this.checked;
    document.getElementById('newHeaderInput').disabled = !this.checked;
  });
}

function showAddToHeaderModal(assignmentName, dueDateISO) {
  const modal = document.getElementById('addToHeaderModal');
  if (!modal) {
    console.error('Add to header modal not found');
    return;
  }

  const headerSelect = document.getElementById('headerSelect');
  const newHeaderInput = document.getElementById('newHeaderInput');
  const addToExistingRadio = document.getElementById('addToExisting');
  const createNewRadio = document.getElementById('createNew');

  if (!headerSelect || !newHeaderInput || !addToExistingRadio || !createNewRadio) {
    console.error('Required modal elements not found');
    return;
  }
  
  // Store the assignment details for use in the confirmation
  modal.dataset.assignmentName = assignmentName || '';
  modal.dataset.dueDateISO = dueDateISO || '';
  
  // Clear previous selections
  headerSelect.value = '';
  newHeaderInput.value = '';
  addToExistingRadio.checked = true;
  createNewRadio.checked = false;
  
  // Enable/disable inputs based on radio selection
  headerSelect.disabled = false;
  newHeaderInput.disabled = true;
  
  // Populate header select with existing headers
  headerSelect.innerHTML = '<option value="">Choose a list...</option>';
  
  // Get all task sections from the DOM
  const sections = document.querySelectorAll('.task-section');
  console.log(`Found ${sections.length} task sections for dropdown`);
  
  sections.forEach(section => {
    const headerTitle = section.querySelector('.task-title');
    if (headerTitle) {
      const headerText = headerTitle.textContent.trim();
      console.log(`Adding header to dropdown: ${headerText}`);
      
      const option = document.createElement('option');
      option.value = headerText;
      option.textContent = headerText;
      headerSelect.appendChild(option);
    }
  });
  
  // Show the modal
  modal.style.display = 'block';
}

function confirmAddToHeader() {
  const modal = document.getElementById('addToHeaderModal');
  const assignmentName = modal.dataset.assignmentName;
  const dueDateISO = modal.dataset.dueDateISO;
  const addToExistingRadio = document.getElementById('addToExisting');
  
  let headerName;
  if (addToExistingRadio.checked) {
    headerName = document.getElementById('headerSelect').value;
  } else {
    headerName = document.getElementById('newHeaderInput').value;
  }
  
  if (!headerName) {
    alert('Please select or enter a header name');
    return;
  }
  
  // Add the assignment to the selected/new header
  addAssignmentToTasks(assignmentName, dueDateISO, headerName);
  
  // Close the modal
  modal.style.display = 'none';
}

// Filter out discussions from being displayed
assignmentsList.querySelectorAll('.assignment-item').forEach(item => {
  if (item.dataset.type === 'discussion_topic') {
    item.style.display = 'none';
  }
});

// Function to show the welcome screen
function showWelcomeScreen() {
    console.log('Starting welcome screen...');
    try {
    // Remove any existing welcome overlay first
    const existingOverlay = document.getElementById('welcomeOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create and add the new overlay
    const overlay = createWelcomeOverlay();
    document.body.appendChild(overlay);
    
    // Show the overlay with animation
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        const contentContainer = overlay.querySelector('.content-container');
        if (contentContainer) {
            contentContainer.style.opacity = '1';
            contentContainer.style.transform = 'translateY(0)';
        }
    });
        console.log('Welcome screen shown successfully');
    } catch (error) {
        console.error('Error showing welcome screen:', error);
    }
}

// Make functions available globally
window.showWelcomeScreen = showWelcomeScreen;
window.createWelcomeOverlay = createWelcomeOverlay;
window.hideWelcomeScreen = hideWelcomeScreen;

// Welcome Screen Functions
function createWelcomeOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'welcomeOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #0a1930 0%, #1f1147 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
    `;

    // Remove all the background elements and keep only the base color gradient
    // Add dynamic light effect at the corners for more depth
    const lightEffect = document.createElement('div');
    lightEffect.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: 
            radial-gradient(circle at 10% 10%, rgba(79, 172, 254, 0.15) 0%, transparent 30%),
            radial-gradient(circle at 90% 90%, rgba(196, 113, 237, 0.15) 0%, transparent 30%);
        opacity: 0.7;
    `;
    overlay.appendChild(lightEffect);

    // Add radial gradient overlay for depth without animation
    const radialGradient = document.createElement('div');
    radialGradient.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center, transparent 30%, #0a1930 80%);
    `;
    overlay.appendChild(radialGradient);

    // Main content container with glass effect
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = `
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 3.5rem;
        max-width: 90%;
        width: 850px;
        transform: translateY(20px) scale(0.98);
        opacity: 0;
        transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 3.5rem;
        background: rgba(255, 255, 255, 0.04);
        backdrop-filter: blur(20px);
        border-radius: 28px;
        border: 1px solid rgba(255, 255, 255, 0.07);
        box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 40px rgba(79, 172, 254, 0.08) inset;
    `;
    
    // Define speechBubble early (moved up to fix the reference error)
    const speechBubble = document.createElement('div');
    speechBubble.style.cssText = `
        position: absolute;
        background: rgba(30, 40, 60, 0.8);
        color: rgba(255, 255, 255, 0.95);
        padding: 15px 20px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        top: 140px; /* Position precisely below the avatar */
        left: 50%;
        transform: translateX(-50%) translateY(10px) scale(0.95);
        width: max-content;
        box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(100, 130, 255, 0.3) inset;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: none;
        max-width: 260px;
        min-width: 220px;
        z-index: 10;
        text-align: center;
        backdrop-filter: blur(10px);
    `;
    
    // Add speech bubble arrow and style with upward pointing arrow
    speechBubble.innerHTML = `
        <div style="position: absolute; left: 50%; top: -12px; transform: translateX(-50%) rotate(45deg); width: 20px; height: 20px; 
             background: rgba(30, 40, 60, 0.8); border-left: 1px solid rgba(100, 130, 255, 0.3); border-top: 1px solid rgba(100, 130, 255, 0.3);"></div>
        <div style="position: relative;">
            <span id="sassyMessage" style="position: relative;">Back for another round of optimistic planning?</span>
        </div>
    `;
    
    // Collection of sassy messages without emojis
    const sassyMessages = [
        { text: "Well, look who decided to show up today!" },
        { text: "Let me guess, another day of procrastination?" },
        { text: "Oh great, more tasks you won't complete!" },
        { text: "I was starting to think you'd forgotten about me." },
        { text: "Ready to pretend you'll be productive?" },
        { text: "Let's organize those tasks you'll ignore later!" },
        { text: "Back for another round of optimistic planning?" },
        { text: "I missed judging your productivity!" },
        { text: "This list isn't going to ignore itself!" },
        { text: "Welcome back to your neglected tasks!" },
        { text: "Oh, you're actually using this app? How novel." },
        { text: "Let's add some tasks to your collection of failed aspirations." }
    ];

    // Create avatar container
    const avatarContainer = document.createElement('div');
    avatarContainer.style.cssText = `
        width: 140px;
        height: 140px;
        position: relative;
        cursor: pointer;
        animation: float 6s infinite ease-in-out;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: transform 0.3s ease, filter 0.3s ease;
        margin-bottom: 60px; /* Add space for the speech bubble below */
    `;
    
    // Add keyframes for floating animation to existing style or create new
    const existingStyle = document.querySelector('style');
    if (existingStyle) {
        existingStyle.textContent += `
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
    }
    
    // Add hover effect for avatar to make it more interactive
    avatarContainer.onmouseenter = () => {
        // Enhance the existing float animation with a scale effect
        avatarContainer.style.transform = 'scale(1.05)';
        avatarContainer.style.filter = 'drop-shadow(0 10px 25px rgba(79, 172, 254, 0.5))';
        
        // Show sassy message on hover with 70% chance
        if (Math.random() > 0.3) {
            const randomSassy = sassyMessages[Math.floor(Math.random() * sassyMessages.length)];
            document.getElementById('sassyMessage').textContent = randomSassy.text;
            speechBubble.style.opacity = '1';
            speechBubble.style.transform = 'translateX(-50%) translateY(0) scale(1)';
            speechBubble.style.animation = 'bubble-bounce 0.5s forwards';
        }
    };
    
    avatarContainer.onmouseleave = () => {
        // Restore original state
        avatarContainer.style.transform = '';
        avatarContainer.style.filter = '';
        
        // Hide speech bubble
        speechBubble.style.opacity = '0';
        speechBubble.style.transform = 'translateX(-50%) translateY(10px) scale(0.95)';
        speechBubble.style.animation = '';
    };

    // Create SVG avatar (Minimal style with expressions)
    const svgNamespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("width", "140");
    svg.setAttribute("height", "140");
    svg.setAttribute("viewBox", "0 0 140 140");

    // Create gradient for the avatar
    const defs = document.createElementNS(svgNamespace, "defs");

    // Main gradient for the ring
    const circleGradient = document.createElementNS(svgNamespace, "linearGradient");
    circleGradient.setAttribute("id", "circleGradient");
    circleGradient.setAttribute("x1", "0%");
    circleGradient.setAttribute("y1", "0%");
    circleGradient.setAttribute("x2", "100%");
    circleGradient.setAttribute("y2", "100%");

    const stop1 = document.createElementNS(svgNamespace, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#4facfe");

    const stop2 = document.createElementNS(svgNamespace, "stop");
    stop2.setAttribute("offset", "50%");
    stop2.setAttribute("stop-color", "#7a88fe");

    const stop3 = document.createElementNS(svgNamespace, "stop");
    stop3.setAttribute("offset", "100%");
    stop3.setAttribute("stop-color", "#c471ed");

    circleGradient.appendChild(stop1);
    circleGradient.appendChild(stop2);
    circleGradient.appendChild(stop3);
    defs.appendChild(circleGradient);
    svg.appendChild(defs);

    // Create outer ring with gradient
    const ring = document.createElementNS(svgNamespace, "circle");
    ring.setAttribute("cx", "70");
    ring.setAttribute("cy", "70");
    ring.setAttribute("r", "50");
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "url(#circleGradient)");
    ring.setAttribute("stroke-width", "10");
    ring.id = "avatarRing";
    
    // Add the ring rotation animation
    ring.style.transformOrigin = "center";
    ring.style.animation = "ringRotate 30s linear infinite";
    
    svg.appendChild(ring);

    // Create inner circle with solid fill
    const innerCircle = document.createElementNS(svgNamespace, "circle");
    innerCircle.setAttribute("cx", "70");
    innerCircle.setAttribute("cy", "70");
    innerCircle.setAttribute("r", "46");
    innerCircle.setAttribute("fill", "rgba(20, 30, 50, 0.6)");
    innerCircle.setAttribute("filter", "drop-shadow(0 0 10px rgba(79, 172, 254, 0.5))");
    svg.appendChild(innerCircle);

    // Create the face group
    const faceGroup = document.createElementNS(svgNamespace, "g");
    faceGroup.id = "faceGroup";

    // Create left eye (fixed position)
    const leftEye = document.createElementNS(svgNamespace, "circle");
    leftEye.setAttribute("cx", "50");
    leftEye.setAttribute("cy", "70");
    leftEye.setAttribute("r", "5");
    leftEye.setAttribute("fill", "#4facfe");
    leftEye.id = "leftEye";
    faceGroup.appendChild(leftEye);

    // Create right eye (fixed position)
    const rightEye = document.createElementNS(svgNamespace, "circle");
    rightEye.setAttribute("cx", "90");
    rightEye.setAttribute("cy", "70");
    rightEye.setAttribute("r", "5");
    rightEye.setAttribute("fill", "#7a88fe");
    rightEye.id = "rightEye";
    faceGroup.appendChild(rightEye);

    // Create smiling mouth (fixed)
    const mouth = document.createElementNS(svgNamespace, "path");
    mouth.setAttribute("d", "M55,90 Q70,98 85,90");
    mouth.setAttribute("stroke", "#c471ed");
    mouth.setAttribute("stroke-width", "3");
    mouth.setAttribute("fill", "none");
    mouth.setAttribute("stroke-linecap", "round");
    mouth.id = "mouth";
    faceGroup.appendChild(mouth);

    svg.appendChild(faceGroup);

    // Add animations for ring only
    const style = document.createElement('style');
    style.textContent = `
        @keyframes colorShift {
            0%, 100% { stop-color: #4facfe; }
            25% { stop-color: #7a88fe; }
            50% { stop-color: #c471ed; }
            75% { stop-color: #00f2fe; }
        }
        @keyframes colorPulse {
            0%, 100% { fill: #4facfe; }
            25% { fill: #7a88fe; }
            50% { fill: #c471ed; }
            75% { fill: #00f2fe; }
        }
        @keyframes ringRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes float-y {
            0% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0); }
        }
        @keyframes bubble-bounce {
            0% { transform: translateX(-50%) translateY(10px) scale(0.95); opacity: 0; }
            50% { transform: translateX(-50%) translateY(-5px) scale(1.02); }
            70% { transform: translateX(-50%) translateY(2px) scale(0.98); }
            100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
        }
        @keyframes shimmer {
            0% { background-position: -100% 0; }
            100% { background-position: 200% 0; }
        }
        @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        @keyframes faceToCheck {
            0% { opacity: 1; }
            40% { opacity: 0; }
            60% { opacity: 0; }
            100% { opacity: 1; }
        }
        @keyframes circleToCheck {
            0% { stroke-dashoffset: 1000; stroke-dasharray: 0 1000; }
            60% { stroke-dashoffset: 1000; stroke-dasharray: 0 1000; }
            100% { stroke-dashoffset: 0; stroke-dasharray: 1000 1000; }
        }
        @keyframes morphToCheck {
            0% { d: path('M55,90 Q70,98 85,90'); stroke-width: 2; stroke: #c471ed; }
            20% { d: path('M50,85 Q70,95 90,80'); stroke-width: 4; stroke: #a076fe; }
            40% { d: path('M48,80 Q65,95 92,70'); stroke-width: 6; stroke: #7a88fe; }
            60% { d: path('M45,75 Q65,95 95,65'); stroke-width: 8; stroke: #5b9cfe; }
            80% { d: path('M42,72 L60,90 L98,55'); stroke-width: 9; stroke: #4facfe; }
            100% { d: path('M40,70 L60,90 L100,50'); stroke-width: 10; stroke: #4facfe; }
        }
        @keyframes eyesToCheckStart {
            0% { 
                r: 5;
                opacity: 1;
                fill: #4facfe;
            }
            40% { 
                r: 4;
                opacity: 0.8;
                fill: #4facfe;
            }
            100% { 
                r: 0;
            opacity: 0;
                fill: #4facfe;
            }
        }
        @keyframes leftEyeMove {
            0% { cx: 50; }
            100% { cx: 60; }
        }
        @keyframes rightEyeMove {
            0% { cx: 90; }
            100% { cx: 100; }
        }
        @keyframes pulseBorder {
            0% { stroke-width: 10; }
            50% { stroke-width: 12; }
            100% { stroke-width: 10; }
        }
        @keyframes fadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
        @keyframes checkmarkDraw {
            0% { stroke-dashoffset: 100; opacity: 0; }
            10% { stroke-dashoffset: 100; opacity: 0.4; }
            30% { stroke-dashoffset: 80; opacity: 0.8; }
            60% { stroke-dashoffset: 40; opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes smoothFadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
        @keyframes smoothCheckmarkDraw {
            0% { stroke-dashoffset: 120; }
            100% { stroke-dashoffset: 0; }
        }
        @keyframes smoothFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        @keyframes smoothPulse {
            0% { stroke-width: 10; }
            50% { stroke-width: 12; }
            100% { stroke-width: 10; }
        }
    `;
    document.head.appendChild(style);

    // Animate the gradient ring
    const animateGradient = () => {
        // Safely animate gradient stops
        if (stop1 && stop1.style) stop1.style.animation = 'colorShift 8s ease-in-out infinite';
        if (stop2 && stop2.style) stop2.style.animation = 'colorShift 8s ease-in-out infinite 2s';
        if (stop3 && stop3.style) stop3.style.animation = 'colorShift 8s ease-in-out infinite 4s';
        
        // Safely animate eyes with color pulse
        const leftEye = document.getElementById('leftEye');
        const rightEye = document.getElementById('rightEye');
        
        if (leftEye && leftEye.style) leftEye.style.animation = 'colorPulse 8s ease-in-out infinite';
        if (rightEye && rightEye.style) rightEye.style.animation = 'colorPulse 8s ease-in-out infinite 3s';
    };

    // Initial animation
    animateGradient();

    // Add hover interactions for the speech bubble only
    avatarContainer.addEventListener('mouseenter', () => {
        // Show sassy message on hover with 60% chance
        if (Math.random() > 0.4) {
            const randomSassy = sassyMessages[Math.floor(Math.random() * sassyMessages.length)];
            document.getElementById('sassyMessage').textContent = randomSassy.text;
            speechBubble.style.opacity = '1';
            speechBubble.style.transform = 'translateX(-50%) translateY(0) scale(1)';
            speechBubble.style.animation = 'bubble-bounce 0.5s forwards';
        }
    });

    avatarContainer.addEventListener('mouseleave', () => {
        // Hide speech bubble
        speechBubble.style.opacity = '0';
        speechBubble.style.transform = 'translateX(-50%) translateY(10px) scale(0.95)';
        speechBubble.style.animation = '';
    });

    // Add click interaction for speech bubble
    avatarContainer.addEventListener('click', () => {
        // Show a random message
        const randomSassy = sassyMessages[Math.floor(Math.random() * sassyMessages.length)];
        document.getElementById('sassyMessage').textContent = randomSassy.text;
        
        // Show speech bubble
        speechBubble.style.opacity = '1';
        speechBubble.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        speechBubble.style.animation = 'bubble-bounce 0.5s forwards';
        
        // Hide the message after a few seconds
        setTimeout(() => {
            speechBubble.style.opacity = '0';
            speechBubble.style.transform = 'translateX(-50%) translateY(10px) scale(0.95)';
            speechBubble.style.animation = '';
        }, 4000);
    });

    // Assemble the avatar
    avatarContainer.appendChild(svg);
    avatarContainer.appendChild(speechBubble);

    // Create greeting with personality
    const greeting = document.createElement('div');
    greeting.style.cssText = `
        text-align: left;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2rem;
        width: 100%;
    `;

    // Welcome title
    const welcomeTitle = document.createElement('div');
    welcomeTitle.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.6rem;
        animation: fadeSlideUp 0.8s 0.4s both;
    `;

    // Welcome title
    const welcomeText = document.createElement('h1');
    welcomeText.textContent = 'Hello there!';
    welcomeText.style.cssText = `
        font-size: 3.8rem;
        font-weight: 800;
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
        padding: 0;
        text-align: left;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        letter-spacing: -0.02em;
        line-height: 1.05;
    `;

    // Add subtitle
    const subtitle = document.createElement('h2');
    subtitle.textContent = "Let's organize your life";
    subtitle.style.cssText = `
        font-size: 1.6rem;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
        padding: 0;
        letter-spacing: -0.01em;
    `;

    welcomeTitle.appendChild(welcomeText);
    welcomeTitle.appendChild(subtitle);

    // Add witty tagline
    const tagline = document.createElement('p');
    tagline.textContent = "Get organized or don't. I'm just an app, not your boss.";
    tagline.style.cssText = `
        font-size: 1.15rem;
        color: rgba(255, 255, 255, 0.65);
        margin: 0.2rem 0 0 0;
        max-width: 85%;
        font-weight: 400;
        animation: fadeSlideUp 0.8s 0.6s both;
        line-height: 1.5;
    `;

    // Add app features section
    const featuresList = document.createElement('div');
    featuresList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        margin-top: 0.5rem;
        animation: fadeSlideUp 0.8s 0.7s both;
    `;
    
    // Feature items
    const features = [
        { icon: '✓', text: 'Simple and intuitive task management' },
        { icon: '✓', text: 'Organize with custom headers and sections' },
        { icon: '✓', text: 'Track your productivity and streaks' }
    ];
    
    features.forEach(feature => {
        const featureItem = document.createElement('div');
        featureItem.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.8rem;
        `;
        
        const featureIcon = document.createElement('span');
        featureIcon.textContent = feature.icon;
        featureIcon.style.cssText = `
            color: #4facfe;
            font-size: 1rem;
            font-weight: bold;
            background: rgba(79, 172, 254, 0.15);
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        `;
        
        const featureText = document.createElement('span');
        featureText.textContent = feature.text;
        featureText.style.cssText = `
            color: rgba(255, 255, 255, 0.75);
            font-size: 1rem;
        `;
        
        featureItem.appendChild(featureIcon);
        featureItem.appendChild(featureText);
        featuresList.appendChild(featureItem);
    });

    // Add action buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 1rem;
        margin-top: 2.5rem;
        animation: fadeSlideUp 0.8s 0.8s both;
    `;

    // Primary button
    const primaryButton = document.createElement('button');
    primaryButton.textContent = 'GET STARTED';
    primaryButton.style.cssText = `
        padding: 1.1rem 2.2rem;
        font-size: 1rem;
        font-weight: 600;
        background: linear-gradient(135deg, #4facfe, #00f2fe);
        color: white;
        border: none;
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 6px 20px rgba(79, 172, 254, 0.3);
        letter-spacing: 0.02em;
        text-align: center;
        position: relative;
        overflow: hidden;
        min-width: 200px;
    `;

    // Add shimmer effect to the button
    const shimmer = document.createElement('div');
    shimmer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 3s infinite;
        pointer-events: none;
    `;
    primaryButton.appendChild(shimmer);

    primaryButton.onmouseover = () => {
        primaryButton.style.transform = 'translateY(-3px) scale(1.02)';
        primaryButton.style.boxShadow = '0 10px 25px rgba(79, 172, 254, 0.5)';
        shimmer.style.animationDuration = '1.5s';
    };

    primaryButton.onmouseout = () => {
        primaryButton.style.transform = 'translateY(0) scale(1)';
        primaryButton.style.boxShadow = '0 6px 20px rgba(79, 172, 254, 0.3)';
        shimmer.style.animationDuration = '3s';
    };

    primaryButton.onclick = () => {
        // Get the face elements
        const leftEye = document.getElementById('leftEye');
        const rightEye = document.getElementById('rightEye');
        const mouth = document.getElementById('mouth');
        const faceGroup = document.getElementById('faceGroup');
        const ring = document.getElementById('avatarRing');
        
        // Disable hover effects during animation
        avatarContainer.onmouseenter = null;
        avatarContainer.onmouseleave = null;
        
        // Hide the speech bubble if visible
        speechBubble.style.opacity = '0';
        
        // Create checkmark SVG
        const svg = faceGroup.parentNode;
        const checkmark = document.createElementNS("http://www.w3.org/2000/svg", "path");
        
        // Set up checkmark properties
        checkmark.setAttribute("d", "M40,70 L60,90 L100,50");
        checkmark.setAttribute("stroke", "#4facfe");
        checkmark.setAttribute("stroke-width", "10");
        checkmark.setAttribute("fill", "none");
        checkmark.setAttribute("stroke-linecap", "round");
        checkmark.setAttribute("stroke-linejoin", "round");
        checkmark.setAttribute("opacity", "0");
        checkmark.style.strokeDasharray = "120";
        checkmark.style.strokeDashoffset = "120";
        
        // Add checkmark to SVG but keep it invisible
        svg.appendChild(checkmark);
        
        // First gradually fade out the face
        faceGroup.style.animation = "smoothFadeOut 0.4s forwards ease-out";
        
        // Start fading in the checkmark slightly before face is completely gone
        // This creates a smoother transition with overlap
        setTimeout(() => {
            // Show checkmark element
            checkmark.style.opacity = "1";
            checkmark.style.animation = "smoothCheckmarkDraw 0.7s forwards cubic-bezier(0.22, 0.61, 0.36, 1)";
            
            // Completely hide face group
            faceGroup.style.display = "none";
            
            // Subtle pulse of the ring
            if (ring) {
                ring.style.animation = "smoothPulse 0.8s forwards ease-in-out";
            }
        }, 280);
        
        // Hide welcome screen after animation completes
        setTimeout(() => {
            hideWelcomeScreen();
        }, 1300);
    };

    // Assemble greeting elements
    greeting.appendChild(welcomeTitle);
    greeting.appendChild(tagline);
    greeting.appendChild(featuresList);
    greeting.appendChild(buttonContainer);
    buttonContainer.appendChild(primaryButton);

    // Prepare left and right columns
    const leftColumn = document.createElement('div');
    leftColumn.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        position: relative;
    `;

    // Add subtle decorative elements to left column
    const decorativeElement = document.createElement('div');
    decorativeElement.style.cssText = `
        position: absolute;
        top: -15px;
        left: -20px;
        width: 90px;
        height: 90px;
        border-radius: 20px;
        background: linear-gradient(135deg, rgba(79, 172, 254, 0.1), rgba(122, 136, 254, 0.1));
        transform: rotate(-15deg);
        z-index: -1;
    `;
    leftColumn.appendChild(decorativeElement);
    
    // Add a small decorative dot
    const decorativeDot = document.createElement('div');
    decorativeDot.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 10px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(200, 113, 237, 0.1), rgba(122, 136, 254, 0.1));
        z-index: -1;
    `;
    leftColumn.appendChild(decorativeDot);

    const rightColumn = document.createElement('div');
    rightColumn.style.cssText = `
        width: 180px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        position: relative;
        padding-bottom: 60px; /* Add extra padding to accommodate the speech bubble */
    `;

    // Add a glow effect behind the avatar
    const avatarGlow = document.createElement('div');
    avatarGlow.style.cssText = `
        position: absolute;
        width: 140px;
        height: 140px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(79, 172, 254, 0.2) 0%, transparent 70%);
        filter: blur(10px);
        animation: pulse 3s infinite ease-in-out;
    `;
    
    // Add keyframes for the pulse animation
    const pulseStyle = document.createElement('style');
    pulseStyle.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.1); opacity: 0.9; }
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        @keyframes bubble-bounce {
            0% { transform: translateX(-50%) translateY(10px) scale(0.95); opacity: 0; }
            50% { transform: translateX(-50%) translateY(-5px) scale(1.02); }
            70% { transform: translateX(-50%) translateY(2px) scale(0.98); }
            100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(pulseStyle);

    // Assemble components
    greeting.appendChild(welcomeTitle);
    greeting.appendChild(tagline);
    greeting.appendChild(featuresList);
    greeting.appendChild(buttonContainer);
    buttonContainer.appendChild(primaryButton);

    // Use the existing avatarContainer, just update its styles
    avatarContainer.style.cssText = `
        width: 140px;
        height: 140px;
        position: relative;
        cursor: pointer;
        animation: float 6s infinite ease-in-out;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    leftColumn.appendChild(greeting);
    rightColumn.appendChild(avatarGlow);
    rightColumn.appendChild(avatarContainer);

    // Assemble the content in landscape orientation
    contentWrapper.appendChild(leftColumn);
    contentWrapper.appendChild(rightColumn);
    overlay.appendChild(contentWrapper);

    // Trigger animations
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        contentWrapper.style.transform = 'translateY(0) scale(1)';
        contentWrapper.style.opacity = '1';
    });

    return overlay;
}

function hideWelcomeScreen() {
    const overlay = document.getElementById('welcomeOverlay');
    if (!overlay) return;
    
    // Fade out the welcome screen
    overlay.style.opacity = '0';
    
    // Find the content wrapper
    const contentWrapper = overlay.querySelector('div[style*="position: relative"]');
    if (contentWrapper) {
        contentWrapper.style.transform = 'translateY(20px) scale(0.95)';
        contentWrapper.style.opacity = '0';
    }
    
    // Remove from DOM after transition completes
    setTimeout(() => {
        // Clean up any event listeners to prevent memory leaks
        const avatarContainer = overlay.querySelector('div[style*="cursor: pointer"]');
        if (avatarContainer) {
            avatarContainer.removeEventListener('mouseenter', avatarContainer.onmouseenter);
            avatarContainer.removeEventListener('mouseleave', avatarContainer.onmouseleave);
            avatarContainer.removeEventListener('click', avatarContainer.onclick);
        }
        
        // No resize listeners to remove as we removed the canvas
        
        // No animation frames to cancel as we removed the animation
        
        // Remove the overlay from the DOM
        overlay.remove();
    }, 800);
}

// Add this function to update relative dates
function updateRelativeDates() {
  const dueDateElements = document.querySelectorAll('.due-relative');
  dueDateElements.forEach(element => {
    const taskItem = element.closest('.task-item');
    if (taskItem) {
      const taskText = taskItem.querySelector('.task-text').textContent;
      const dueDateMatch = taskText.match(/\(Due: (.*?)\)/);
      if (dueDateMatch) {
        const dueDateISO = dueDateMatch[1];
        element.textContent = getRelativeDueDate(dueDateISO);
      }
    }
  });
}

// Update initializeApp function to include periodic updates
function initializeApp() {
  // Add CSS for smooth transitions
  const style = document.createElement('style');
  style.textContent = `
    .section-content {
      transition: height 0.3s ease;
    }
    .task-list {
      transition: height 0.3s ease;
    }
  `;
  document.head.appendChild(style);

  // Initialize collapsible sections
  initializeCollapsibleSections();

  // Load todos
  loadTodos();

  // Set up event listeners
  setupEventListeners();
  setupDragAndDrop();
  setupContextMenu();

  // Initialize Canvas filters
  initializeCanvasFilters();

  // Update productivity stats
  updateProductivityStats();

  // Set up periodic updates for relative dates (every minute)
  setInterval(updateRelativeDates, 60000);

  // Show welcome screen for first-time users
  window.electronAPI.isDevelopment().then(isDev => {
    if (isDev) {
      const welcomeTestButton = document.getElementById('welcomeTestButton');
      if (welcomeTestButton) {
        welcomeTestButton.style.display = 'block';
        welcomeTestButton.addEventListener('click', showWelcomeScreen);
      }
    }
  });
}

// ... rest of your existing code ...

// Handler for when a task is dragged over a section
function handleTaskOverSection(e) {
  // Only process this event if we're dragging a task item, not a section
  if (!draggedItem || e.target.classList.contains('dragging-section')) return;
  
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  // Add visual feedback to the section
  e.currentTarget.classList.add('task-drag-over');
  
  // Highlight the task list within the section if the task is hovered over it
  const taskList = e.currentTarget.querySelector('.task-list');
  if (taskList) {
    taskList.classList.add('drag-over');
  }
}

// Handler for when a task is dropped on a section
function handleTaskDropOnSection(e) {
  // Only process this event if we're dragging a task item, not a section
  if (!draggedItem || document.querySelector('.dragging-section')) return;
  
  e.preventDefault();
  
  // Remove visual feedback
  e.currentTarget.classList.remove('task-drag-over');
  
  // Find the task list within the section
  const taskList = e.currentTarget.querySelector('.task-list');
  if (taskList) {
    // Add the dragged task to the end of this task list
    taskList.appendChild(draggedItem);
    
    // If it was a subtask before, remove subtask styling
    if (draggedItem.dataset.wasSubtask === 'true') {
      draggedItem.classList.remove('subtask-item');
    }
    
    // Clean up
    draggedItem.classList.remove('dragging');
    delete draggedItem.dataset.wasSubtask;
    draggedItem = null;
    
    // Save changes
    saveTodos();
    
    // Remove highlight
    taskList.classList.remove('drag-over');
  }
}

// Handler for when a task is dragged over the app container
function handleTaskOverContainer(e) {
  // Only process this event if we're dragging a task item, not a section
  if (!draggedItem || document.querySelector('.dragging-section')) return;
  
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

// Handler for when a task is dropped on the app container
function handleTaskDropOnContainer(e) {
  // Only process this event if we're dragging a task item, not a section
  if (!draggedItem || document.querySelector('.dragging-section')) return;
  
  e.preventDefault();
  
  // Find the first available task list and add the task there
  const firstTaskList = document.querySelector('.task-list');
  if (firstTaskList) {
    // Add the dragged task to the first task list
    firstTaskList.appendChild(draggedItem);
    
    // If it was a subtask before, remove subtask styling
    if (draggedItem.dataset.wasSubtask === 'true') {
      draggedItem.classList.remove('subtask-item');
    }
    
    // Clean up
    draggedItem.classList.remove('dragging');
    delete draggedItem.dataset.wasSubtask;
    draggedItem = null;
    
    // Save changes
    saveTodos();
    
    // Show toast notification
    showToast('Task moved to first list');
  }
}

// Handler for when a task is dragged over a task header
function handleTaskOverHeader(e) {
  // Only process this event if we're dragging a task item, not a section
  if (!draggedItem || document.querySelector('.dragging-section')) return;
  
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  // Add visual feedback to the header
  e.currentTarget.classList.add('header-drag-over');
  
  // Find the section this header belongs to and highlight it
  const section = e.currentTarget.closest('.task-section');
  if (section) {
    section.classList.add('task-drag-over');
  }
}

// Handler for when a task is dropped on a task header
function handleTaskDropOnHeader(e) {
  // Only process this event if we're dragging a task item, not a section
  if (!draggedItem || document.querySelector('.dragging-section')) return;
  
  e.preventDefault();
  
  // Remove visual feedback
  e.currentTarget.classList.remove('header-drag-over');
  
  // Find the section this header belongs to
  const section = e.currentTarget.closest('.task-section');
  if (section) {
    section.classList.remove('task-drag-over');
    
    // Find the task list within the section
    const taskList = section.querySelector('.task-list');
    if (taskList) {
      // Add the dragged task to this task list
      taskList.appendChild(draggedItem);
      
      // If it was a subtask before, remove subtask styling
      if (draggedItem.dataset.wasSubtask === 'true') {
        draggedItem.classList.remove('subtask-item');
      }
      
      // Clean up
      draggedItem.classList.remove('dragging');
      delete draggedItem.dataset.wasSubtask;
      draggedItem = null;
      
      // Save changes
      saveTodos();
      
      // Show a toast notification
      const headerTitle = section.querySelector('.task-title');
      if (headerTitle) {
        showToast(`Task moved to ${headerTitle.textContent}`);
      }
    }
  }
}

// Function to show modal for moving a task to a different header
function showMoveTaskModal(taskItem) {
  // Check if the move task modal exists, create it if not
  if (!document.getElementById('moveTaskModal')) {
    const modalHtml = `
      <div id="moveTaskModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Move to List</h3>
            <button class="close-button" onclick="document.getElementById('moveTaskModal').style.display='none'">&times;</button>
          </div>
          <div class="modal-body">
            <div class="select-wrapper">
              <select id="moveTaskHeaderSelect" class="header-select">
                <option value="">Choose a list...</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button id="confirmMoveTaskBtn" class="add-button">MOVE TASK</button>
            <button onclick="document.getElementById('moveTaskModal').style.display='none'" class="cancel-button">CANCEL</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listener for the confirm button
    document.getElementById('confirmMoveTaskBtn').addEventListener('click', confirmMoveTask);
  }
  
  const modal = document.getElementById('moveTaskModal');
  const headerSelect = document.getElementById('moveTaskHeaderSelect');
  
  // Store the task item reference in the modal's dataset
  modal.dataset.taskId = taskItem.dataset.id;
  
  // Clear previous selections and populate header select with existing headers
  headerSelect.innerHTML = '<option value="">Choose a list...</option>';
  
  // Get all task sections from the DOM
  const sections = document.querySelectorAll('.task-section');
  console.log(`Found ${sections.length} task sections for dropdown`);
  
  // Get the current section this task belongs to
  const currentSection = taskItem.closest('.task-section');
  const currentHeaderTitle = currentSection ? currentSection.querySelector('.task-title').textContent.trim() : '';
  
  sections.forEach(section => {
    const headerTitle = section.querySelector('.task-title');
    if (headerTitle) {
      const headerText = headerTitle.textContent.trim();
      
      // Skip the current section the task is already in
      if (headerText === currentHeaderTitle) {
        return;
      }
      
      console.log(`Adding header to dropdown: ${headerText}`);
      
      const option = document.createElement('option');
      option.value = headerText;
      option.textContent = headerText;
      headerSelect.appendChild(option);
    }
  });
  
  // Show the modal
  modal.style.display = 'block';
}

// Function to handle confirming task move
function confirmMoveTask() {
  const modal = document.getElementById('moveTaskModal');
  const headerSelect = document.getElementById('moveTaskHeaderSelect');
  const selectedHeaderText = headerSelect.value;
  
  if (!selectedHeaderText) {
    alert('Please select a list to move the task to');
    return;
  }
  
  // Find the task by ID
  const taskId = modal.dataset.taskId;
  const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
  
  if (!taskItem) {
    console.error('Task not found');
    modal.style.display = 'none';
    return;
  }
  
  // Find the target task list based on selected header
  let targetTaskList = null;
  const taskSections = document.querySelectorAll('.task-section');
  
  for (const section of taskSections) {
    const headerTitle = section.querySelector('.task-title');
    if (headerTitle && headerTitle.textContent.trim() === selectedHeaderText) {
      targetTaskList = section.querySelector('.task-list');
      break;
    }
  }
  
  if (!targetTaskList) {
    console.error('Target task list not found for header:', selectedHeaderText);
    modal.style.display = 'none';
    return;
  }
  
  // Move the task to the target list
  targetTaskList.appendChild(taskItem);
  
  // If it was a subtask before, remove subtask styling
  if (taskItem.classList.contains('subtask-item')) {
    taskItem.classList.remove('subtask-item');
  }
  
  // Save changes
  saveTodos();
  
  // Show a toast notification
  showToast(`Task moved to ${selectedHeaderText}`);
  
  // Close the modal
  modal.style.display = 'none';
  
  // Update task counts
  updateTaskCounts();
}