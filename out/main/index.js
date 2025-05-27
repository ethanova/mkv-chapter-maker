"use strict";
const electron = require("electron");
const path = require("path");
const icon = path.join(__dirname, "../../resources/icon.png");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  if (!electron.app.isPackaged) {
    mainWindow.webContents.on("context-menu", (_event, params) => {
      mainWindow.webContents.inspectElement(params.x, params.y);
    });
  }
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (!electron.app.isPackaged && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  electron.app.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    if (!electron.app.isPackaged) {
      window.webContents.on("before-input-event", (event, input) => {
        if (input.key.toUpperCase() === "F12" && !input.alt && !input.control && !input.meta && !input.shift) {
          if (window.webContents.isDevToolsOpened()) {
            window.webContents.closeDevTools();
          } else {
            window.webContents.openDevTools({ mode: "undocked" });
          }
          event.preventDefault();
        }
      });
    }
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
