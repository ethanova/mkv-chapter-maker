import * as React from "react";

interface TimeTravelProps {
  adjustPlayTime: (time: number) => void;
}

export const TimeTravelButtons: React.FC<TimeTravelProps> = ({
  adjustPlayTime,
}) => {
  return (
    <div className="mt-4 flex justify-center space-x-2">
      <button
        onClick={() => adjustPlayTime(-10)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        -10s
      </button>
      <button
        onClick={() => adjustPlayTime(-5)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        -5s
      </button>
      <button
        onClick={() => adjustPlayTime(-1)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        -1s
      </button>
      <button
        onClick={() => adjustPlayTime(-0.5)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        -500ms
      </button>
      <button
        onClick={() => adjustPlayTime(-0.1)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        -100ms
      </button>
      <button
        onClick={() => adjustPlayTime(0.1)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        +100ms
      </button>
      <button
        onClick={() => adjustPlayTime(0.5)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        +500ms
      </button>
      <button
        onClick={() => adjustPlayTime(1)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        +1s
      </button>
      <button
        onClick={() => adjustPlayTime(5)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        +5s
      </button>
      <button
        onClick={() => adjustPlayTime(10)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        +10s
      </button>
    </div>
  );
};
