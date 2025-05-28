import { commonFFmpegPaths } from "../../../constants";
import { useEffect, useState } from "react";

export const FFmpegNotFound = () => {
  const [filteredPaths, setFilteredPaths] = useState<string[]>([]);

  useEffect(() => {
    // Get the OS type when component mounts
    window.api.getOS().then((platform: string) => {
      
      // Filter paths based on OS
      const relevantPaths = commonFFmpegPaths.filter(path => {
        if (platform === "win32") {
          return path.includes("C:\\");
        } else if (platform === "darwin") {
          // For macOS, show paths like /opt/homebrew/bin and /usr/local/bin
          return path === "/opt/homebrew/bin" || path === "/usr/local/bin";
        } else {
          // For Linux, show paths like /usr/bin and /usr/local/bin
          return path === "/usr/bin" || path === "/usr/local/bin";
        }
      });
      
      setFilteredPaths(relevantPaths);
    }).catch(err => {
      console.error("Error getting OS type:", err);
      // If there's an error, show all paths
      setFilteredPaths(commonFFmpegPaths);
    });
  }, []);
  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">FFmpeg Not Found</h1>
      <p className="text-gray-600 mb-4">
        Please install FFmpeg or ensure it is on your PATH to use this
        application. Expected to find it at one of the following locations:
      </p>
      <ul className="list-disc text-gray-600 mb-4">
        {filteredPaths.length > 0 ? (
          filteredPaths.map((path, index) => (
            <li key={index}>{path}</li>
          ))
        ) : (
          // Fallback if no paths are filtered or while loading
          commonFFmpegPaths.map((path, index) => (
            <li key={index}>{path}</li>
          ))
        )}
      </ul>
      <button
        onClick={() => window.api.openFFmpegDownloadPage()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Download FFmpeg
      </button>
    </div>
  );
};
