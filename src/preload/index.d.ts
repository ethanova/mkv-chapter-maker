import { ElectronAPI } from "@electron-toolkit/preload";

interface API {
  getOS: () => Promise<string>;
  getFileMetadata: (filePath: string) => Promise<any>;
  openFileDialog: () => Promise<string | null>;
  saveChapters: (
    filePath: string,
    chapters: Array<{ title: string; start: number }>
  ) => Promise<string>;
  checkForFFmpeg: () => Promise<{
    installed: boolean;
    version?: string;
    error?: string;
  }>;
  openFFmpegDownloadPage: () => Promise<void>;
  onFFmpegProgress: (
    callback: (progress: { time: string; raw: string }) => void
  ) => () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: API;
  }
}
