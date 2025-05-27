export interface Chapter {
  timebase: string;
  start: number;
  end: number;
  title: string;
}

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
