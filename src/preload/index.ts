import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { Chapter } from "../types";

// Custom APIs for renderer
const api = {
  getFileMetadata: (filePath: string) =>
    ipcRenderer.invoke("get-file-metadata", filePath),
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  saveChapters: (filePath: string, chapters: Chapter[]) =>
    ipcRenderer.invoke("save-chapters", filePath, chapters),
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
