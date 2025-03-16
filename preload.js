const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    getTodos: async () => {
      console.log('Preload: Getting todos...');
      const result = await ipcRenderer.invoke('getTodos');
      console.log('Preload: Got todos:', result);
      return result;
    },
    saveTodos: async (taskStates) => {
      console.log('Preload: Saving todos:', taskStates);
      const result = await ipcRenderer.invoke('saveTodos', taskStates);
      console.log('Preload: Save result:', result);
      return result;
    },
    togglePin: () => ipcRenderer.invoke('toggle-pin'),
    fetchCanvasAssignments: (apiKey, apiUrl) => ipcRenderer.invoke('fetch-canvas-assignments', apiKey, apiUrl),
    openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
    storeCanvasApiKey: (apiKey) => ipcRenderer.invoke('store-canvas-api-key', apiKey),
    getStoredCanvasApiKey: () => ipcRenderer.invoke('get-stored-canvas-api-key'),
    storeCanvasApiUrl: (apiUrl) => ipcRenderer.invoke('store-canvas-api-url', apiUrl),
    getStoredCanvasApiUrl: () => ipcRenderer.invoke('get-stored-canvas-api-url'),
    clearStoredData: () => ipcRenderer.invoke('clear-stored-data'),
    getStreak: () => ipcRenderer.invoke('getStreak'),
    setStreak: (streak) => ipcRenderer.invoke('setStreak', streak),
    getLastVisit: () => ipcRenderer.invoke('getLastVisit'),
    setLastVisit: (date) => ipcRenderer.invoke('setLastVisit', date),
    receive: (channel, func) => {
      if (channel === 'show-canvas-modal') {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    isDevelopment: () => ipcRenderer.invoke('is-development-mode')
  }
);

// Add listener for refresh events
ipcRenderer.on('refresh-assignments', () => {
  window.dispatchEvent(new CustomEvent('refresh-assignments'));
});

contextBridge.exposeInMainWorld(
  'api', {
    store: {
      get: (key) => ipcRenderer.invoke('store-get', key),
      set: (key, value) => ipcRenderer.invoke('store-set', { key, value }),
    },
    getAppPath: () => ipcRenderer.invoke('getAppPath'),
  }
);
