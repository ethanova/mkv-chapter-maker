import { useState } from "react";
import "video-react/dist/video-react.css"; // CSS for video-react
import { ControlBar, Player } from "video-react"; // Player component
import { Chapter, parseChapters } from "./utils";
// import AppBar from "./AppBar";

function App() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  // Example chapter data, replace with actual logic later
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

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
  };

  return (
    <div className="flex flex-col">
      <div className="flex h-screen font-sans bg-gray-50">
        {/* Left Column: Chapters */}
        <div className="w-1/5 bg-slate-100 p-4 flex flex-col border-r border-slate-300 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-700">
            Chapters
          </h2>
          <div className="overflow-y-auto flex-grow">
            {chapters.length === 0 ? (
              <p className="text-slate-500 italic">
                Select a video to see chapters.
              </p>
            ) : (
              <ul className="space-y-2">
                {chapters.map((chapter) => (
                  <li
                    key={chapter.title}
                    className="p-2 bg-white rounded-md shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    {chapter.title}
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
              <button className="text-black" onClick={closeVideo}>
                Close Video
              </button>
              <div className="w-full max-w-4xl h-auto aspect-video shadow-xl rounded-lg overflow-hidden bg-black">
                <Player src={selectedVideo} autoPlay={false}>
                  {/* The Player component handles the source internally if src is provided */}
                  <ControlBar autoHide={false} className="my-class" />
                </Player>
              </div>
            </>
          )}
          {/* No hidden file input needed anymore, using Electron's dialog */}
        </div>
      </div>
    </div>
  );
}

export default App;
