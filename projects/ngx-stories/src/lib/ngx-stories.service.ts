import { Injectable } from "@angular/core";
import { StoryGroup } from "./interfaces/interfaces";
@Injectable({
  providedIn: 'root',
})
export class NgxStoriesService {

  constructor() { }

  // Logic for starting story progress
  startProgress(interval: number, callback: () => void): any {
    return setInterval(() => callback(), interval);
  }

  // Clears the progress interval
  clearProgress(intervalId: any): void {
    clearInterval(intervalId);
  }

  nextStory(storyGroups: StoryGroup[], currentStoryGroupIndex: number, currentStoryIndex: number): { storyGroupIndex: number, storyIndex: number } {
    let stories = storyGroups[currentStoryGroupIndex]?.stories;
    if (currentStoryIndex === stories.length - 1) {
      // Move to the next storyGroup if the current story index is the last
      currentStoryGroupIndex = (currentStoryGroupIndex + 1) % storyGroups.length;
      currentStoryIndex = 0;
    } else {
      // Otherwise, just move to the next story within the same storyGroup
      currentStoryIndex++;
    }
    return { storyGroupIndex: currentStoryGroupIndex, storyIndex: currentStoryIndex };
  }

  prevStory(storyGroups: StoryGroup[], currentStoryGroupIndex: number, currentStoryIndex: number): { storyGroupIndex: number, storyIndex: number } {
    let stories = storyGroups[currentStoryGroupIndex]?.stories;
    if (currentStoryIndex === 0) {
      // Move to the previous storyGroup if the current story index is 0
      if (currentStoryGroupIndex > 0) {
        currentStoryGroupIndex--;
        stories = storyGroups[currentStoryGroupIndex]?.stories;
        currentStoryIndex = stories.length - 1;
      }
    } else {
      // Otherwise, just move to the previous story within the same storyGroup
      currentStoryIndex--;
    }
    return { storyGroupIndex: currentStoryGroupIndex, storyIndex: currentStoryIndex };
  }
}
