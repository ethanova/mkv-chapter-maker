import * as React from "react";
import { Chapter, formatMillisecondsToTime } from "../utils";
import { TrashIcon } from "@heroicons/react/24/solid";

interface ChapterCardProps {
  chapter: Chapter;
  onClick: () => void;
  onDelete: () => void;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  onClick,
  onDelete,
}) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    onDelete();
  };

  return (
    <div
      className="p-3 bg-white rounded-md shadow-sm hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center"
      onClick={onClick}
    >
      <div className="flex-grow">
        <h3 className="font-medium text-slate-800 truncate">{chapter.title}</h3>
        <div className="text-sm text-slate-500 mt-1">
          {formatMillisecondsToTime(chapter.start)} –{" "}
          {formatMillisecondsToTime(chapter.end)}
        </div>
      </div>
      <button
        className="text-slate-400 hover:text-red-500 transition-colors ml-2 p-2 rounded h-full flex items-center hover:bg-slate-100"
        onClick={handleDeleteClick}
        aria-label="Delete chapter"
      >
        <TrashIcon className="size-5" />
      </button>
    </div>
  );
};

export default ChapterCard;
