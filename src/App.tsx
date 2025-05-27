import React, { useState, useRef, useEffect } from 'react';
import 'video-react/dist/video-react.css'; // CSS for video-react
import { Player } from 'video-react'; // Player component
import AppBar from './AppBar';

// Placeholder for chapter type, can be refined later
interface Chapter {
  id: string;
  name: string;
  timestamp: number; // Example property
}

function App() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  // Example chapter data, replace with actual logic later
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Call this when your app is ready and has loaded
    if (window.Main) {
      window.Main.removeLoading();
    }
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  const handleVideoSelectContainerClick = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a URL for the selected file to be used by the video player
      const videoUrl = URL.createObjectURL(file);
      console.log('selected video', videoUrl);
      setSelectedVideo(videoUrl);
      // Potentially clear chapters or load new ones based on the video
      setChapters([]); // Reset chapters on new video
    }
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="flex flex-col">
      {window.Main && (
        <div className="flex-none">
          <AppBar />
        </div>
      )}
      <div className="flex h-screen font-sans bg-gray-50">
        {/* Left Column: Chapters */}
        <div className="w-1/5 bg-slate-100 p-4 flex flex-col border-r border-slate-300 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-700">Chapters</h2>
          <div className="overflow-y-auto flex-grow">
            {chapters.length === 0 ? (
              <p className="text-slate-500 italic">Select a video to see chapters.</p>
            ) : (
              <ul className="space-y-2">
                {chapters.map((chapter) => (
                  <li
                    key={chapter.id}
                    className="p-2 bg-white rounded-md shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    {chapter.name}
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
                if (e.key === 'Enter' || e.key === ' ') handleVideoSelectContainerClick();
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
              <p className="text-sm text-slate-500">(Click to choose a file from your computer)</p>
            </div>
          ) : (
            <div className="w-full max-w-4xl h-auto aspect-video shadow-xl rounded-lg overflow-hidden bg-black">
              <button onClick={closeVideo}>Close Video</button>
              <Player src={selectedVideo} autoPlay={false}>
                {/* The Player component handles the source internally if src is provided */}
              </Player>
            </div>
          )}
          {/* Hidden file input, more specific accept types */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/mp4,video/webm,video/ogg,video/mkv,.mkv"
            className="hidden"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
