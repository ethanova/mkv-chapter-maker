import { Chapter } from "../../types";

/*
Metadata sample:
;FFMETADATA1
MINOR_VERSION=0
COMPATIBLE_BRANDS=iso6av01mp41
MAJOR_BRAND=dash
encoder=Lavf61.7.100
[CHAPTER]
TIMEBASE=1/1000000000
START=1000000
END=2268000000000
title=The Start
[CHAPTER]
TIMEBASE=1/1000000000
START=2268001000000
END=2406000000000
title=Sleepy Dinos
[CHAPTER]
TIMEBASE=1/1000000000
START=2406001000000
END=3617000000000
title=The Rest
*/
export const parseChapters = (metadata: string): Chapter[] => {
  if (!metadata) {
    return [];
  }

  const chapters: Chapter[] = [];
  const lines = metadata.split("\n");

  let currentChapter: Partial<Chapter> = {};
  let inChapterSection = false;
  let conversionFactor = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === "[CHAPTER]") {
      // Start a new chapter section
      inChapterSection = true;
      currentChapter = {};
      // Reset conversion factor for each new chapter
      conversionFactor = 1;
    } else if (inChapterSection) {
      if (trimmedLine.startsWith("TIMEBASE=")) {
        const timebaseValue = trimmedLine.substring("TIMEBASE=".length);
        // Parse the timebase to calculate conversion factor
        // Format is typically "1/DENOMINATOR"
        const timebaseParts = timebaseValue.split("/");
        if (timebaseParts.length === 2) {
          const numerator = parseInt(timebaseParts[0], 10) || 1;
          const denominator = parseInt(timebaseParts[1], 10) || 1;
          // Calculate conversion factor to convert to milliseconds (1/1000)
          conversionFactor = denominator / 1000 / numerator;
        }
        // Set the normalized timebase
        currentChapter.timebase = "1/1000";
      } else if (trimmedLine.startsWith("START=")) {
        const originalStart = parseInt(
          trimmedLine.substring("START=".length),
          10
        );
        // Normalize to milliseconds
        currentChapter.start = Math.round(originalStart / conversionFactor);
      } else if (trimmedLine.startsWith("END=")) {
        const originalEnd = parseInt(trimmedLine.substring("END=".length), 10);
        // Normalize to milliseconds
        currentChapter.end = Math.round(originalEnd / conversionFactor);
      } else if (trimmedLine.startsWith("title=")) {
        currentChapter.title = trimmedLine.substring("title=".length);

        // If we have all required fields, add the chapter and reset
        if (
          currentChapter.timebase &&
          currentChapter.start !== undefined &&
          currentChapter.end !== undefined &&
          currentChapter.title
        ) {
          chapters.push(currentChapter as Chapter);
          inChapterSection = false;
        }
      } else if (trimmedLine.startsWith("[")) {
        // We've reached a new section that isn't a chapter
        inChapterSection = false;
      }
    }
  }

  //   if (chapters.length === 0) {
  //     return [
  //       {
  //         timebase: "1/1000",
  //         start: 0,
  //         end: 0,
  //         title: "New Chapter",
  //       },
  //     ];
  //   }

  return chapters;
};

/**
 * Formats milliseconds into a human-readable HH:mm:ss.sss format
 * @param milliseconds - Time in milliseconds
 * @returns Formatted time string in HH:mm:ss.sss format
 */
export const formatMillisecondsToTime = (milliseconds: number): string => {
  if (milliseconds < 0) {
    return "00:00:00.000";
  }

  // Convert milliseconds to seconds for calculation
  const totalSeconds = milliseconds / 1000;

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Format with padding and 3 decimal places for seconds
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toFixed(3).padStart(6, "0");

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};

/**
 * Inserts a new chapter at the specified start time, adjusting existing chapters as needed.
 *
 * If the new start value falls between any chapter's start and end:
 * - Sets that chapter's end to the new start time minus 1
 * - Inserts a new chapter with the new start time and the previous chapter's original end time
 *
 * @param chapters - The array of existing chapters
 * @param newStart - The start time of the new chapter in milliseconds
 * @param title - Optional title for the new chapter (defaults to "New Chapter")
 * @param videoLength - The length of the video in milliseconds
 * @returns Updated array of chapters with the new chapter inserted
 */
export const insertChapter = (
  chapters: Chapter[],
  newStart: number,
  title: string = "New Chapter",
  videoLength: number
): Chapter[] => {
  // Create a deep copy of the chapters array to avoid mutating the original
  const updatedChapters = Array.from(chapters) as Chapter[];

  // Default values
  const defaultTimebase = "1/1000";
  let newEnd = -1;
  let insertIndex = updatedChapters.length; // Default to appending at the end

  if (chapters.length === 0) {
    // If there are no chapters, the new chapter will be the only one
    newEnd = videoLength;
  } else if (newStart < chapters[0].start) {
    // If the new start is before the first chapter, it will be the first chapter
    newEnd = chapters[0].start;
    // Insert at the beginning
    insertIndex = 0;
  } else {
    // Find if the new start falls between any existing chapter
    for (let i = 0; i < updatedChapters.length; i++) {
      const chapter = updatedChapters[i];

      if (newStart >= chapter.start && newStart <= chapter.end) {
        // New start falls within this chapter
        newEnd = chapter.end;
        // Update this chapter's end to be just before the new chapter starts
        chapter.end = newStart - 1;
        // Insert after this chapter
        insertIndex = i + 1;
        break;
      }
    }
  }

  // If newEnd is still -1, it means we're adding at the end
  // In that case, set a reasonable end time (e.g., +10 seconds from start)
  if (newEnd === -1 && updatedChapters.length > 0) {
    newEnd = videoLength;
  }

  // Create the new chapter
  const newChapter: Chapter = {
    timebase: defaultTimebase,
    start: newStart,
    end: newEnd,
    title: title,
  };

  // Insert the new chapter at the calculated position
  updatedChapters.splice(insertIndex, 0, newChapter);

  return updatedChapters;
};
