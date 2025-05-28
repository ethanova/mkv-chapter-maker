import { commonFFmpegPaths } from "../../../constants";

export const FFmpegNotFound = () => {
  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">FFmpeg Not Found</h1>
      <p className="text-gray-600 mb-4">
        Please install FFmpeg or ensure it is on your PATH to use this
        application. Expected to find it at one of the following locations:
      </p>
      <ul className="list-disc text-gray-600 mb-4">
        {commonFFmpegPaths.map((path, index) => (
          <li key={index}>{path}</li>
        ))}
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
