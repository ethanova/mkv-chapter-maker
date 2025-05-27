export interface Chapter {
  timebase: string;
  start: number;
  end: number;
  title: string;
}

export const parseChapters = (metadata: string): Chapter[] => {
  if (!metadata) {
    return [];
  }

  const chapters: Chapter[] = [];
  const lines = metadata.split('\n');
  
  let currentChapter: Partial<Chapter> = {};
  let inChapterSection = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '[CHAPTER]') {
      // Start a new chapter section
      inChapterSection = true;
      currentChapter = {};
    } else if (inChapterSection) {
      if (trimmedLine.startsWith('TIMEBASE=')) {
        currentChapter.timebase = trimmedLine.substring('TIMEBASE='.length);
      } else if (trimmedLine.startsWith('START=')) {
        currentChapter.start = parseInt(trimmedLine.substring('START='.length), 10);
      } else if (trimmedLine.startsWith('END=')) {
        currentChapter.end = parseInt(trimmedLine.substring('END='.length), 10);
      } else if (trimmedLine.startsWith('title=')) {
        currentChapter.title = trimmedLine.substring('title='.length);
        
        // If we have all required fields, add the chapter and reset
        if (currentChapter.timebase && 
            currentChapter.start !== undefined && 
            currentChapter.end !== undefined && 
            currentChapter.title) {
          chapters.push(currentChapter as Chapter);
          inChapterSection = false;
        }
      } else if (trimmedLine.startsWith('[')) {
        // We've reached a new section that isn't a chapter
        inChapterSection = false;
      }
    }
  }
  
  return chapters;
};
