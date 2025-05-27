import { ElectronAPI } from "@electron-toolkit/preload";

interface API {
  getFileMetadata: (filePath: string) => Promise<any>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: API;
  }
}
