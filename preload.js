const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bridge', {
  whipCrack: () => ipcRenderer.send('whip-crack'),
  hideOverlay: () => ipcRenderer.send('hide-overlay'),
  setInteractionMode: configuring => ipcRenderer.send('set-interaction-mode', configuring),
  onSpawnWhip: (fn) => ipcRenderer.on('spawn-whip', () => fn()),
  onOpenArmory: (fn) => ipcRenderer.on('open-armory', () => fn()),
  onDropWhip: (fn) => ipcRenderer.on('drop-whip', () => fn()),
});
