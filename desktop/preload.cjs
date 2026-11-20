const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopShell", {
  isDesktop: true,
  updateInteractiveRegions(regions) {
    ipcRenderer.send("desktop:update-interactive-regions", regions);
  },
});
