const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, ...args) => {
    const validChannels = [
      'db:getKeys',
      'db:saveKeys',
      'db:testKey',
      'db:getFeeds',
      'db:addFeed',
      'db:deleteFeed',
      'db:getHistory',
      'db:getHistoryDetail',
      'db:deleteHistory',
      'db:importDb',
      'db:exportDb',
      'db:vacuum',
      'db:getSetting',
      'db:saveSetting',
      'scrape:run',
      'gemini:chat',
      'export:markdown',
      'app:minimizeToTray',
      'app:selectDirectory',
      'twitter:login',
      'twitter:logout',
      'twitter:status',
      'telegram:test',
      'telegram:getSettings',
      'telegram:saveSettings'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
  },
  onProgress: (callback) => {
    const subscription = (event, progress) => callback(progress);
    ipcRenderer.on('scrape:progress', subscription);
    return () => {
      ipcRenderer.removeListener('scrape:progress', subscription);
    };
  }
});
