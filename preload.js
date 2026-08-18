const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bridge', {
  whipCrack: () => ipcRenderer.send('whip-crack'),
  hideOverlay: () => ipcRenderer.send('hide-overlay'),
  setInteractionMode: configuring => ipcRenderer.send('set-interaction-mode', configuring),
  onSpawnWhip: (fn) => ipcRenderer.on('spawn-whip', (_event, layout) => fn(layout)),
  onOpenArmory: (fn) => ipcRenderer.on('open-armory', (_event, layout) => fn(layout)),
  onDesktopLayout: (fn) => ipcRenderer.on('desktop-layout', (_event, layout) => fn(layout)),
  onDropWhip: (fn) => ipcRenderer.on('drop-whip', () => fn()),
});
