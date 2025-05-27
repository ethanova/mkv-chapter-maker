import { ElectronAPI } from "@electron-toolkit/preload";

interface API {
  getFileMetadata: (filePath: string) => Promise<any>;
  openFileDialog: () => Promise<string | null>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: API;
  }
}
