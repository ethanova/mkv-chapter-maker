import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { Chapter } from "../types";

// Custom APIs for renderer
const api = {
  getOS: () => ipcRenderer.invoke("get-os"),
  getFileMetadata: (filePath: string) =>
    ipcRenderer.invoke("get-file-metadata", filePath),
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  saveChapters: (filePath: string, chapters: Chapter[]) =>
    ipcRenderer.invoke("save-chapters", filePath, chapters),
  checkForFFmpeg: () => ipcRenderer.invoke("check-for-ffmpeg"),
  openFFmpegDownloadPage: () => ipcRenderer.invoke("open-ffmpeg-download-page"),
  // Add listener for ffmpeg progress events
  onFFmpegProgress: (callback: (progress: { time: string; raw: string }) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, progress: { time: string; raw: string }) => {
      callback(progress);
    };
    
    // Add the event listener
    ipcRenderer.on('ffmpeg-progress', subscription);
    
    // Return a function to remove the listener when no longer needed
    return () => {
      ipcRenderer.removeListener('ffmpeg-progress', subscription);
    };
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
