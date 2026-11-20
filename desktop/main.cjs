const { app, BrowserWindow, ipcMain, Menu, nativeImage, screen, Tray } = require("electron");
const path = require("path");

const WINDOW_WIDTH = 520;
const WINDOW_HEIGHT = 620;

let mainWindow = null;
let tray = null;
let quitting = false;
let interactiveRegions = [];
let mousePassThroughTimer = null;

function moveToBottomRight() {
  if (!mainWindow) return;
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;
  mainWindow.setPosition(
    Math.round(x + width - WINDOW_WIDTH - 16),
    Math.round(y + height - WINDOW_HEIGHT - 16),
  );
}

function showWindow() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.moveTop();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: WINDOW_WIDTH,
    minHeight: WINDOW_HEIGHT,
    transparent: true,
    frame: false,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, "..", "index.html"), {
    query: { desktop: "1" },
  });
  moveToBottomRight();

  mainWindow.once("ready-to-show", showWindow);
  mainWindow.on("close", (event) => {
    if (quitting) return;
    event.preventDefault();
    mainWindow.hide();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
    interactiveRegions = [];
  });
}

function startMousePassThrough() {
  clearInterval(mousePassThroughTimer);
  mousePassThroughTimer = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible()) return;
    const cursor = screen.getCursorScreenPoint();
    const bounds = mainWindow.getBounds();
    const localX = cursor.x - bounds.x;
    const localY = cursor.y - bounds.y;
    const overInteractiveRegion = interactiveRegions.some((region) => (
      localX >= region.left &&
      localX <= region.right &&
      localY >= region.top &&
      localY <= region.bottom
    ));
    mainWindow.setIgnoreMouseEvents(!overInteractiveRegion, { forward: true });
  }, 50);
}

function createTray() {
  const iconPath = path.join(__dirname, "assets", "app.png");
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 });
  tray = new Tray(icon);
  tray.setToolTip("小方 AI 助手");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "显示小方", click: showWindow },
      { label: "隐藏小方", click: () => mainWindow?.hide() },
      { label: "恢复到右下角", click: () => { moveToBottomRight(); showWindow(); } },
      { type: "separator" },
      {
        label: "始终置顶",
        type: "checkbox",
        checked: true,
        click: (item) => mainWindow?.setAlwaysOnTop(item.checked),
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on("double-click", showWindow);
}

const hasLock = app.requestSingleInstanceLock();

if (!hasLock) {
  app.quit();
} else {
  app.on("second-instance", showWindow);
  app.whenReady().then(() => {
    ipcMain.on("desktop:update-interactive-regions", (event, regions) => {
      if (!mainWindow || event.sender !== mainWindow.webContents) return;
      interactiveRegions = Array.isArray(regions)
        ? regions.filter((region) => (
          Number.isFinite(region?.left) &&
          Number.isFinite(region?.right) &&
          Number.isFinite(region?.top) &&
          Number.isFinite(region?.bottom)
        ))
        : [];
    });

    createWindow();
    createTray();
    startMousePassThrough();

    app.on("activate", () => {
      if (!mainWindow) createWindow();
      else showWindow();
    });
  });

  app.on("before-quit", () => {
    quitting = true;
    clearInterval(mousePassThroughTimer);
  });

  app.on("window-all-closed", (event) => {
    event?.preventDefault?.();
  });
}
