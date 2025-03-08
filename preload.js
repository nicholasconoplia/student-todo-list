const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    getTodos: () => ipcRenderer.invoke('get-todos'),
    saveTodos: (todos) => ipcRenderer.invoke('save-todos', todos),
    togglePin: () => ipcRenderer.invoke('toggle-pin'),
    fetchCanvasAssignments: (apiKey) => ipcRenderer.invoke('fetch-canvas-assignments', apiKey),
    openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
    storeCanvasApiKey: (apiKey) => ipcRenderer.invoke('store-canvas-api-key', apiKey),
    getStoredCanvasApiKey: () => ipcRenderer.invoke('get-stored-canvas-api-key'),
    receive: (channel, func) => {
      if (channel === 'show-canvas-modal') {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  }
);

// Add listener for refresh events
ipcRenderer.on('refresh-assignments', () => {
  window.dispatchEvent(new CustomEvent('refresh-assignments'));
});
