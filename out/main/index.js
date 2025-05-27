"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const child_process = require("child_process");
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
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
    window.webContents.openDevTools();
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  electron.ipcMain.handle("get-file-metadata", async (_event, filePath) => {
    console.log("Getting metadata for:", filePath);
    try {
      const ffprobe = child_process.spawn("ffmpeg", [
        "-i",
        filePath,
        "-f",
        "ffmetadata",
        "-"
      ]);
      return new Promise((resolve, reject) => {
        let stdout = "";
        let stderr = "";
        ffprobe.stdout.on("data", (data) => {
          stdout += data.toString();
        });
        ffprobe.stderr.on("data", (data) => {
          stderr += data.toString();
        });
        ffprobe.on("close", (code) => {
          if (code === 0) {
            try {
              const metadata = JSON.parse(stdout);
              resolve(metadata);
            } catch (err) {
              reject(`Error parsing ffprobe output: ${err}`);
            }
          } else {
            reject(`ffprobe exited with code ${code}: ${stderr}`);
          }
        });
        ffprobe.on("error", (err) => {
          reject(`Failed to spawn ffprobe: ${err.message}`);
        });
      });
    } catch (error) {
      console.error("Error running ffprobe:", error);
      throw error;
    }
  });
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
