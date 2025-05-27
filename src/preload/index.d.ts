import { ElectronAPI } from "@electron-toolkit/preload";

interface API {
  getFileMetadata: (filePath: string) => Promise<any>;
  openFileDialog: () => Promise<string | null>;
  saveChapters: (filePath: string, chapters: Array<{title: string, start: number}>) => Promise<string>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: API;
  }
}
