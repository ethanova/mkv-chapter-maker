import { app, shell, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { spawn } from "child_process";
import * as fs from "fs";
import { promisify } from "util";
import { Chapter } from "../types";
import os from "os";
import path from "path";
import { commonFFmpegPaths } from "../constants";

function prependFFmpegPaths() {
  const platform = os.platform();

  const extraPaths = commonFFmpegPaths
    .filter((p) => {
      if (platform === "win32") {
        return p.includes("C:\\");
      } else {
        return p.startsWith("/");
      }
    })
    .join(path.delimiter); // Windows uses `;`, POSIX uses `:`

  if (extraPaths) {
    process.env.PATH = extraPaths + path.delimiter + process.env.PATH;
  }
}

prependFFmpegPaths();

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      webSecurity: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
    if (is.dev) {
      window.webContents.openDevTools();
    }
  });

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));

  // Handle opening file dialog
  ipcMain.handle("open-file-dialog", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Videos", extensions: ["mp4", "webm", "ogg", "mkv"] }],
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    return filePaths[0];
  });

  // Handle opening FFmpeg download page
  ipcMain.handle("open-ffmpeg-download-page", async () => {
    const url = "https://ffmpeg.org/download.html";
    await shell.openExternal(url);
    return true;
  });

  // Handle checking if FFmpeg is installed
  ipcMain.handle("check-for-ffmpeg", async () => {
    console.log("Checking for FFmpeg installation...");
    try {
      return new Promise((resolve) => {
        const ffmpeg = spawn("ffmpeg", ["-version"]);

        let stdout = "";
        let stderr = "";

        ffmpeg.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        ffmpeg.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        ffmpeg.on("close", (code) => {
          if (code === 0) {
            // FFmpeg is installed and working
            console.log("FFmpeg is installed");
            resolve({ installed: true, version: stdout.split("\n")[0] });
          } else {
            // FFmpeg exited with an error
            console.log("FFmpeg check failed with code:", code);
            resolve({ installed: false, error: stderr });
          }
        });

        ffmpeg.on("error", (err) => {
          // Could not spawn FFmpeg, likely not installed
          console.error("Failed to spawn FFmpeg:", err);
          resolve({ installed: false, error: err.message });
        });
      });
    } catch (error: unknown) {
      console.error("Error checking for FFmpeg:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { installed: false, error: errorMessage };
    }
  });

  // Handle ffmpeg metadata extraction
  ipcMain.handle("get-file-metadata", async (_event, filePath: string) => {
    console.log("Getting metadata for:", filePath);
    try {
      const ffprobe = spawn("ffmpeg", [
        "-i",
        filePath,
        "-f",
        "ffmetadata",
        "-",
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
              const metadata = stdout;
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

  // Handle saving chapters to file
  ipcMain.handle(
    "save-chapters",
    async (_event, filePath: string, chapters: Chapter[]) => {
      console.log("Saving chapters to:", filePath);
      console.log("Chapters:", chapters);

      try {
        // Sort chapters by start time
        const sortedChapters = [...chapters].sort((a, b) => a.start - b.start);

        // Get the original file metadata
        const ffprobe = spawn("ffmpeg", [
          "-i",
          filePath,
          "-f",
          "ffmetadata",
          "-",
        ]);

        const metadataResult = await new Promise<string>((resolve, reject) => {
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
              resolve(stdout);
            } else {
              reject(`ffprobe exited with code ${code}: ${stderr}`);
            }
          });

          ffprobe.on("error", (err) => {
            reject(`Failed to spawn ffprobe: ${err.message}`);
          });
        });

        // Remove existing chapters
        const metadataLines = metadataResult.split("\n");
        const filteredLines: string[] = [];
        let skipChapter = false;

        // Remove existing chapter data - more robust approach
        for (const line of metadataLines) {
          // If we encounter a chapter marker, skip until next section or empty line
          if (line.startsWith("[CHAPTER]")) {
            skipChapter = true;
            continue;
          }

          // If we're in skip mode and encounter a new section marker (starts with [) or empty line, stop skipping
          if (skipChapter && (line.startsWith("[") || line.trim() === "")) {
            skipChapter = false;
          }

          // Only add non-skipped lines to our filtered output
          if (!skipChapter) {
            filteredLines.push(line);
          }
        }

        // Create new metadata with updated chapters
        let updatedMetadata = filteredLines.join("\n");

        console.log("Updated (cleared) metadata:", updatedMetadata);

        // Ensure we have a trailing newline
        if (!updatedMetadata.endsWith("\n")) {
          updatedMetadata += "\n";
        }

        // Add chapters in ffmpeg metadata format
        for (let i = 0; i < sortedChapters.length; i++) {
          const chapter = sortedChapters[i];
          // const nextChapterStart =
          //   i < sortedChapters.length - 1
          //     ? sortedChapters[i + 1].start
          //     : chapter.start + 10000; // If last chapter, add 10 seconds as end

          updatedMetadata += "\n[CHAPTER]\n";
          updatedMetadata += "TIMEBASE=1/1000\n";
          updatedMetadata += `START=${chapter.start}\n`;
          updatedMetadata += `END=${chapter.end}\n`;
          updatedMetadata += `title=${chapter.title}\n`;
        }

        console.log("Updated (with chapters) metadata:", updatedMetadata);

        // Write metadata to temporary file
        const tempMetadataPath = `${filePath}.metadata.txt`;
        await promisify(fs.writeFile)(
          tempMetadataPath,
          updatedMetadata,
          "utf8"
        );

        // Create temporary output file path
        const fileExt = filePath.split(".").pop() || "mkv";
        const outputPath = `${filePath}.new.${fileExt}`;

        console.log("Temporary metadata path:", tempMetadataPath);
        console.log("Output path:", outputPath);

        // Apply the metadata to create a new file
        return new Promise((resolve, reject) => {
          const ffmpeg = spawn("ffmpeg", [
            "-i",
            filePath,
            "-i",
            tempMetadataPath,
            "-map_metadata",
            "1",
            "-map_chapters",
            "1",
            "-codec",
            "copy",
            "-y", // Overwrite if exists
            outputPath,
          ]);

          let stderr = "";
          let lastProgressTime = Date.now();

          ffmpeg.stderr.on("data", (data) => {
            const dataStr = data.toString();
            stderr += dataStr;

            // Parse progress information
            // Only send updates at most every 1s to avoid overwhelming the renderer
            if (Date.now() - lastProgressTime > 1000) {
              const timeMatch = dataStr.match(/time=([0-9:.]+)/i);
              if (timeMatch && timeMatch[1]) {
                const progress = {
                  time: timeMatch[1],
                  raw: dataStr.trim(),
                };

                // Get the BrowserWindow that sent the request
                const win = BrowserWindow.getAllWindows()[0];
                if (win) {
                  win.webContents.send("ffmpeg-progress", progress);
                }

                lastProgressTime = Date.now();
              }
            }
          });

          ffmpeg.on("close", async (code) => {
            try {
              console.log("FFmpeg process closed with code:", code);
              // Remove temporary metadata file
              await promisify(fs.unlink)(tempMetadataPath);

              if (code === 0) {
                // Rename the new file to the original filename
                await promisify(fs.rename)(outputPath, filePath);
                console.log("Chapters saved successfully");
                resolve("Chapters saved successfully");
              } else {
                // Clean up failed output if it exists
                try {
                  await promisify(fs.access)(outputPath);
                  await promisify(fs.unlink)(outputPath);
                } catch (e) {
                  // File doesn't exist, ignore
                }
                console.error("FFmpeg process closed with code:", code);
                reject(`ffmpeg exited with code ${code}: ${stderr}`);
              }
            } catch (err) {
              console.error("Error during file operations:", err);
              reject(`Error during file operations: ${err}`);
            }
          });

          ffmpeg.on("error", (err) => {
            console.error("Failed to spawn ffmpeg:", err);
            reject(`Failed to spawn ffmpeg: ${err.message}`);
          });
        });
      } catch (error) {
        console.error("Error saving chapters:", error);
        throw error;
      }
    }
  );

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
