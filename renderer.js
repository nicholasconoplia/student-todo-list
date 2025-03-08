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

// Todo data
let todos = [];

// Add an undo history
let undoHistory = [];
const MAX_UNDO_HISTORY = 50;

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

// Load todos on startup
async function loadTodos() {
  todos = await window.api.getTodos();
  renderTodoList();
}

// Save todos
async function saveTodos() {
  await window.api.saveTodos(todos);
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

// Update the drag and drop related functions
let draggedItem = null;
let draggedItemIndex = null;

function handleDragStart(e) {
  // Don't start drag if we're editing text
  if (e.target.closest('[contenteditable="true"]:focus')) {
    e.preventDefault();
    return;
  }
  
  draggedItem = e.currentTarget;
  draggedItemIndex = parseInt(draggedItem.dataset.index);
  e.dataTransfer.effectAllowed = 'move';
  draggedItem.classList.add('dragging');
  
  e.dataTransfer.setDragImage(draggedItem, 0, 0);
}

function handleDragEnd(e) {
  draggedItem.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
  draggedItem = null;
  draggedItemIndex = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'move';
  
  const dropZone = e.currentTarget;
  if (!dropZone.classList.contains('drag-over')) {
    dropZone.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const dropZone = e.currentTarget;
  dropZone.classList.remove('drag-over');
  
  if (!draggedItem) return;
  
  saveToUndoHistory();
  
  // Get the task we're moving
  const task = todos[draggedItemIndex];
  if (!task || task.isHeader) return; // Don't allow moving headers
  
  // Remove the task from its current position
  todos.splice(draggedItemIndex, 1);
  
  // Find the new position
  let newIndex;
  if (dropZone.classList.contains('todo-section')) {
    // Dropping into a section
    const headerIndex = parseInt(dropZone.dataset.headerIndex);
    
    // Find the last item in this section
    let lastIndex = headerIndex;
    for (let i = headerIndex + 1; i < todos.length; i++) {
      if (todos[i].isHeader) break;
      lastIndex = i;
    }
    
    // Insert after the last item (or after header if section is empty)
    newIndex = lastIndex + 1;
  } else {
    // Dropping into main list (no header)
    newIndex = 0;
    // Find first header if exists
    const firstHeaderIndex = todos.findIndex(t => t.isHeader);
    if (firstHeaderIndex !== -1) {
      newIndex = firstHeaderIndex;
    }
  }
  
  // Insert the task at the new position
  todos.splice(newIndex, 0, task);
  
  saveTodos();
  renderTodoList();
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

// Add this function to show API key instructions
function showApiKeyInstructions() {
  const instructionsModal = document.createElement('div');
  instructionsModal.className = 'modal api-instructions-modal';
  instructionsModal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>How to Find Your Canvas API Key</h2>
      <ol class="instructions-list">
        <li>Go to your <a href="https://canvas.uts.edu.au/profile/settings" class="canvas-link">Canvas Settings</a></li>
        <li>Scroll down to the "Approved Integrations" section</li>
        <li>Click the "+ New Access Token" button</li>
        <li>Enter a purpose (e.g., "Todo List App")</li>
        <li>Set an expiry date (optional)</li>
        <li>Click "Generate Token"</li>
        <li>Copy the generated token (make sure to save it as it won't be shown again)</li>
        <li>Paste the token in the API Key field</li>
      </ol>
      <div class="instructions-note">
        <strong>Note:</strong> Keep your API key secure and don't share it with others.
      </div>
    </div>
  `;
  
  document.body.appendChild(instructionsModal);
  
  // Add close button functionality
  const closeBtn = instructionsModal.querySelector('.close');
  closeBtn.onclick = () => {
    instructionsModal.style.display = 'none';
  };
  
  // Close if clicked outside
  window.onclick = (e) => {
    if (e.target === instructionsModal) {
      instructionsModal.style.display = 'none';
    }
  };
  
  // Open Canvas settings in browser when link is clicked
  const canvasLink = instructionsModal.querySelector('.canvas-link');
  canvasLink.onclick = (e) => {
    e.preventDefault();
    window.api.openExternalLink(e.target.href);
  };
  
  instructionsModal.style.display = 'block';
}

// Update the showCanvasModal function to include the help link
async function showCanvasModal() {
  const storedKey = await window.api.getStoredCanvasApiKey();
  if (storedKey) {
    canvasApiKeyInput.value = storedKey;
    fetchCanvasAssignments(); // Auto-fetch if we have a stored key
    return; // Don't show the modal if we have a valid key
  }
  
  // Add help link if it doesn't exist
  if (!document.querySelector('.api-help-link')) {
    const helpLink = document.createElement('a');
    helpLink.href = '#';
    helpLink.className = 'api-help-link';
    helpLink.textContent = 'How do I find my API key?';
    helpLink.onclick = (e) => {
      e.preventDefault();
      showApiKeyInstructions();
    };
    
    const authContainer = document.querySelector('.canvas-auth');
    authContainer.appendChild(helpLink);
  }
  
  canvasModal.style.display = 'block';
}

// Close Canvas modal
function closeCanvasModal() {
  canvasModal.style.display = 'none';
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
    
    // If we got here, the API key was valid, so close the modal
    closeCanvasModal();
    
    assignmentsList.innerHTML = '';
    
    // Sort courses alphabetically
    const sortedCourses = Object.values(groupedAssignments).sort((a, b) => 
      a.courseCode.localeCompare(b.courseCode)
    );

    if (sortedCourses.length === 0) {
      assignmentsList.innerHTML = '<div class="no-assignments">No upcoming assignments found</div>';
      return;
    }

    sortedCourses.forEach(course => {
      // Create course header
      const courseHeader = document.createElement('div');
      courseHeader.className = 'course-header';
      courseHeader.innerHTML = `
        <h3>${course.courseCode}</h3>
        <div class="course-name">${course.courseName}</div>
      `;
      assignmentsList.appendChild(courseHeader);

      // Create assignments for this course
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
  } catch (error) {
    if (error.message.includes('API key not found') || error.message.includes('Failed to fetch courses')) {
      alert('Invalid API key. Please check your Canvas API key and try again.');
    } else {
      alert('Error fetching assignments. Please try again later.');
    }
    console.error('Error:', error);
  }
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

// Theme toggle functionality
function initializeTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;

  // Set initial theme
  if (isDark) {
    document.body.classList.add('dark-theme');
    themeToggle.checked = true;
  }

  // Handle theme toggle
  themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-theme');
    const isDarkMode = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  });
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme
  initializeTheme();
  
  // Load initial todos
  loadTodos();
  
  // Add todo button and input
  addTodoButton.addEventListener('click', addTodo);
  newTodoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
  });
  
  // Pin button
  pinButton.addEventListener('click', togglePinStatus);
  
  // Canvas modal buttons
  canvasButton.addEventListener('click', showCanvasModal);
  closeModalBtn.addEventListener('click', closeCanvasModal);
  loadAssignmentsButton.addEventListener('click', fetchCanvasAssignments);
  
  // Close modal if clicked outside
  window.addEventListener('click', (e) => {
    if (e.target === canvasModal) {
      closeCanvasModal();
    }
  });
  
  // Add refresh listener
  window.addEventListener('refresh-assignments', () => {
    fetchCanvasAssignments();
  });
  
  // Listen for show-canvas-modal event
  window.api.receive('show-canvas-modal', () => {
    showCanvasModal();
  });
  
  // Add event listener for canvas links and add assignment buttons
  assignmentsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('canvas-link')) {
      window.api.openExternalLink(e.target.dataset.url);
    }
    if (e.target.classList.contains('add-assignment-button')) {
      handleAddAssignment(e);
    }
  });
  
  // Add clear buttons
  addClearButtons();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Add theme toggle button to header controls
  const headerControls = document.querySelector('.header-controls');
  const themeButton = document.createElement('button');
  themeButton.id = 'themeButton';
  themeButton.className = 'theme-button';
  themeButton.onclick = toggleTheme;
  
  // Set initial theme based on localStorage or system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
  
  if (isDark) {
    document.body.classList.add('dark-theme');
  }
  updateThemeIcon(isDark);
  
  // Insert theme button before existing buttons
  headerControls.insertBefore(themeButton, headerControls.firstChild);
});

// Add the handleAddAssignment function that was missing
function handleAddAssignment(e) {
  const { course, name, due } = e.target.dataset;
  const taskTitle = `${name} - Due: ${due}`;
  
  // Find if course header exists
  const courseIndex = todos.findIndex(todo => todo.isHeader && todo.title === course);
  
  if (courseIndex !== -1) {
    // Add task after course header
    todos.splice(courseIndex + 1, 0, {
      title: taskTitle,
      isChecked: false,
      isHeader: false
    });
  } else {
    // Create course header and add task
    todos.push({
      title: course,
      isChecked: false,
      isHeader: true
    });
    
    todos.push({
      title: taskTitle,
      isChecked: false,
      isHeader: false
    });
  }
  
  saveTodos();
  renderTodoList();
  
  // Show confirmation
  alert(`Added "${name}" to your todo list`);
}

// Add new functions for clearing tasks
function clearAllTasks() {
  if (confirm('Are you sure you want to remove ALL items including headers? This cannot be undone.')) {
    todos = [];
    saveTodos();
    renderTodoList();
  }
}

function clearTasksKeepHeaders() {
  if (confirm('Are you sure you want to remove all tasks but keep headers? This cannot be undone.')) {
    todos = todos.filter(todo => todo.isHeader);
    saveTodos();
    renderTodoList();
  }
}

// Add the clear buttons to the header
function addClearButtons() {
  const headerControls = document.querySelector('.header-controls');
  
  // Create clear buttons container
  const clearButtonsContainer = document.createElement('div');
  clearButtonsContainer.className = 'clear-buttons';
  clearButtonsContainer.style.marginLeft = '10px';
  
  // Create the buttons
  const clearAllButton = document.createElement('button');
  clearAllButton.textContent = 'Clear All';
  clearAllButton.className = 'clear-button';
  clearAllButton.onclick = clearAllTasks;
  
  const clearTasksButton = document.createElement('button');
  clearTasksButton.textContent = 'Clear Tasks';
  clearTasksButton.className = 'clear-button';
  clearTasksButton.onclick = clearTasksKeepHeaders;
  
  // Add buttons to container
  clearButtonsContainer.appendChild(clearTasksButton);
  clearButtonsContainer.appendChild(clearAllButton);
  
  // Add container to header
  headerControls.appendChild(clearButtonsContainer);
}

// Add some CSS for the clear buttons
const style = document.createElement('style');
style.textContent = `
  .clear-buttons {
    display: flex;
    gap: 8px;
  }
  
  .clear-button {
    background-color: #dc3545;
    font-size: 12px;
    padding: 6px 10px;
  }
  
  .clear-button:hover {
    background-color: #c82333;
  }
`;
document.head.appendChild(style);

// Add keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N: New task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      newTodoInput.focus();
    }
    
    // Ctrl/Cmd + H: New header
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      newTodoInput.value = 'New Header:';
      newTodoInput.focus();
    }
    
    // Ctrl/Cmd + D: Toggle done on selected task
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      const focused = document.activeElement;
      const todoEl = focused.closest('.todo-item');
      if (todoEl) {
        const checkbox = todoEl.querySelector('.todo-checkbox');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));
        }
      }
    }
    
    // Ctrl/Cmd + Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  });
}