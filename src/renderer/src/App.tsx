import { useState, useRef, useEffect } from "react";
import "video-react/dist/video-react.css"; // CSS for video-react
import { ControlBar, Player, PlayerReference } from "video-react"; // Player component
import {
  parseChapters,
  formatMillisecondsToTime,
  insertChapter,
} from "./utils";
import ChapterCard from "./components/ChapterCard";
import { Chapter } from "../../types";
import { TimeTravelButtons } from "./components/TimeTravel";

function App() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  // Example chapter data, replace with actual logic later
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  // Reference to the video player
  const playerRef = useRef<PlayerReference | null>(null);
  // State to track current playback time in milliseconds
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [newChapterTitle, setNewChapterTitle] = useState<string>("");
  // State for tracking save status
  const [savingStatus, setSavingStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleVideoSelectContainerClick = async () => {
    try {
      // Open Electron's file dialog
      const filePath = await window.api.openFileDialog();

      if (filePath) {
        handleFileSelection(filePath);
      }
    } catch (error) {
      console.error("Error opening file dialog:", error);
    }
  };

  const handleFileSelection = (filePath: string) => {
    console.log("Selected file path:", filePath);
    setSelectedFilePath(filePath);

    // For video display, we need to create a URL that points to the file
    // Using a protocol handler that works with Electron
    const videoUrl = `file://${filePath}`;
    console.log("Video URL for player:", videoUrl);
    setSelectedVideo(videoUrl);

    // Reset chapters on new video
    setChapters([]);

    // Get the file metadata using ffmpeg
    setLoadingChapters(true);
    window.api
      .getFileMetadata(filePath)
      .then((metadata) => {
        console.log("File metadata:", metadata);
        // Here you can process the metadata to extract chapters if available
        // or use other information from the metadata as needed
        const chapters = parseChapters(metadata);
        setChapters(chapters);
        setLoadingChapters(false);
      })
      .catch((error) => {
        setLoadingChapters(false);
        console.error("Error getting file metadata:", error);
      });
  };

  const closeVideo = () => {
    setSelectedVideo(null);
    setCurrentTimeMs(0);
    playerRef?.current?.load();
    setSelectedFilePath(null);
    setChapters([]);
  };

  // Function to adjust the current play time
  const adjustPlayTime = (secondsToAdjust: number) => {
    if (playerRef.current) {
      const player = playerRef.current;
      const state = player.getState();
      const currentTime = state.player.currentTime;
      const duration = state.player.duration;

      // Calculate new time, ensuring it stays within valid range (0 to duration)
      const newTime = Math.max(
        0,
        Math.min(duration, currentTime + secondsToAdjust)
      );

      // Set the new current time
      player.seek(newTime);
    }
  };

  const addChapter = () => {
    const totalVideoLength = playerRef.current?.getState().player.duration;
    if (!totalVideoLength) {
      console.error("Total video length is not available");
      return;
    }
    const newChapters = insertChapter(
      chapters,
      currentTimeMs,
      newChapterTitle,
      (totalVideoLength - 1) * 1000 // Convert to milliseconds
    );
    setChapters(newChapters);
    setNewChapterTitle("");
  };

  const removeChapter = (index: number) => {
    const newChapters = [...chapters];
    newChapters.splice(index, 1);
    setChapters(newChapters);
  };

  const saveChapters = async () => {
    if (!selectedFilePath || chapters.length === 0) return;

    try {
      setSavingStatus("saving");
      setSaveError(null);

      // Call the electron IPC method to save chapters
      const result = await window.api.saveChapters(selectedFilePath, chapters);

      console.log("Save result:", result);
      setSavingStatus("success");

      // Reset status after a delay
      setTimeout(() => {
        setSavingStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error saving chapters:", error);
      setSavingStatus("error");
      setSaveError(
        typeof error === "string" ? error : "Failed to save chapters"
      );
    }
  };

  // Subscribe to player state changes to update the current time
  useEffect(() => {
    // Check if player reference exists
    if (!playerRef.current) return;

    // Create a listener for player state changes
    const handleStateChange = () => {
      if (playerRef.current?.getState) {
        const state = playerRef.current.getState();
        // Convert seconds to milliseconds for the formatter
        const timeInMs = state.player.currentTime * 1000;
        setCurrentTimeMs(timeInMs);
      }
    };

    // Subscribe to state changes when the player is available
    const player = playerRef.current;
    player.subscribeToStateChange(handleStateChange);

    // Clean up subscription when component unmounts or player changes
    return () => {
      // The video-react Player doesn't provide an unsubscribe method,
      // but the subscription is automatically cleaned up when the component unmounts
      // or when the effect runs again with a different dependency
    };
  }, [selectedVideo]); // Re-subscribe when the video source changes

  return (
    <div className="flex flex-col">
      <div className="flex h-screen font-sans bg-gray-50">
        {/* Left Column: Chapters */}
        <div className="w-1/5 bg-slate-100 p-4 flex flex-col border-r border-slate-300 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-700 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              Chapters
            </h2>
            {selectedFilePath && chapters.length > 0 && (
              <button
                onClick={saveChapters}
                disabled={!selectedVideo || savingStatus === "saving"}
                className={`px-3 py-1 text-sm rounded-md text-white ${
                  savingStatus === "saving" || !selectedVideo
                    ? "bg-gray-400 cursor-not-allowed"
                    : savingStatus === "success"
                      ? "bg-green-500 hover:bg-green-600"
                      : savingStatus === "error"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-blue-500 hover:bg-blue-600"
                } transition-colors flex items-center space-x-1`}
              >
                {savingStatus === "saving" ? (
                  <span>Saving...</span>
                ) : savingStatus === "success" ? (
                  <span>Saved!</span>
                ) : savingStatus === "error" ? (
                  <span>Failed</span>
                ) : (
                  <span>Save</span>
                )}
              </button>
            )}
          </div>
          {saveError && (
            <div className="mb-4 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-sm">
              {saveError}
            </div>
          )}
          <div className="overflow-y-auto flex-grow">
            {loadingChapters ? (
              <p className="text-slate-500 italic">Loading chapters...</p>
            ) : chapters.length === 0 && selectedVideo ? (
              <p className="text-slate-500 italic">
                No chapters found in the selected video.
              </p>
            ) : !selectedVideo ? (
              <p className="text-slate-500 italic">
                Select a video to see chapters.
              </p>
            ) : (
              <ul className="space-y-3">
                {chapters.map((chapter) => (
                  <li key={chapter.title}>
                    <ChapterCard
                      chapter={chapter}
                      onClick={() => {
                        playerRef.current?.seek(chapter.start / 1000);
                      }}
                      onDelete={() => removeChapter(chapters.indexOf(chapter))}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Video Player / Placeholder */}
        <div className="w-4/5 flex flex-col items-center justify-center p-6 bg-white">
          {!selectedVideo ? (
            <div
              className="w-full max-w-2xl h-auto aspect-video border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors p-8"
              onClick={handleVideoSelectContainerClick}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleVideoSelectContainerClick();
              }}
              aria-label="Select video file"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mb-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z"
                />
              </svg>
              <p className="text-lg font-medium">Please select a video</p>
              <p className="text-sm text-slate-500">
                (Click to choose a file from your computer)
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={closeVideo}
                className="mb-4 px-3 py-1 bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors flex items-center space-x-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Close Video</span>
              </button>
              <div className="w-full max-w-4xl h-auto aspect-video shadow-xl rounded-lg overflow-hidden bg-black">
                <Player
                  ref={(player: PlayerReference) => {
                    playerRef.current = player;
                  }}
                  src={selectedVideo}
                  autoPlay={false}
                >
                  {/* The Player component handles the source internally if src is provided */}
                  <ControlBar autoHide={false} className="my-class" />
                </Player>
              </div>
              <TimeTravelButtons adjustPlayTime={adjustPlayTime} />
              <div className="mt-4 flex justify-center space-x-2">
                <span className="text-lg font-mono">
                  Current Time: {formatMillisecondsToTime(currentTimeMs)}
                </span>
              </div>
              <div className="mt-4 flex flex-col items-center space-y-3">
                <div className="w-full max-w-lg">
                  <label
                    htmlFor="chapterTitle"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Chapter Title
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="chapterTitle"
                      type="text"
                      placeholder="Enter a descriptive title"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newChapterTitle) {
                          addChapter();
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      disabled={!newChapterTitle}
                      onClick={addChapter}
                      className={`px-4 py-2 rounded-md text-white font-medium shadow-sm ${
                        !newChapterTitle
                          ? "bg-slate-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 transition-colors"
                      }`}
                    >
                      Add Chapter
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
