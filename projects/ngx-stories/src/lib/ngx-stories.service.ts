import { ElementRef, Injectable, QueryList } from "@angular/core";
import { NgxStoriesOptions, StoryGroup } from "./interfaces/interfaces";
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

  nextStory(storyGroups: StoryGroup[],
    currentStoryGroupIndex: number,
    currentStoryIndex: number,
    onStoryGroupChange: (storyGroupIndex: number) => void): { storyGroupIndex: number, storyIndex: number } {
    let stories = storyGroups[currentStoryGroupIndex]?.stories;
    if (currentStoryIndex === stories.length - 1) {
      // Move to the next storyGroup if the current story index is the last
      currentStoryGroupIndex = currentStoryGroupIndex + 1;
      currentStoryIndex = 0;

      if (currentStoryGroupIndex < storyGroups.length) {
        onStoryGroupChange(currentStoryGroupIndex);
      }

    } else {
      // Otherwise, just move to the next story within the same storyGroup
      currentStoryIndex++;
    }
    return { storyGroupIndex: currentStoryGroupIndex, storyIndex: currentStoryIndex };
  }

  prevStory(storyGroups: StoryGroup[],
    currentStoryGroupIndex: number,
    currentStoryIndex: number,
    onStoryGroupChange: (storyGroupIndex: number) => void): { storyGroupIndex: number, storyIndex: number } {
    let stories = storyGroups[currentStoryGroupIndex]?.stories;
    if (currentStoryIndex === 0) {
      // Move to the previous storyGroup if the current story index is 0
      if (currentStoryGroupIndex > 0) {
        currentStoryGroupIndex--;
        stories = storyGroups[currentStoryGroupIndex]?.stories;
        currentStoryIndex = stories.length - 1;
        onStoryGroupChange(currentStoryGroupIndex);
      }
    } else {
      // Otherwise, just move to the previous story within the same storyGroup
      currentStoryIndex--;
    }
    return { storyGroupIndex: currentStoryGroupIndex, storyIndex: currentStoryIndex };
  }

  setOptions(options: NgxStoriesOptions, storyContainers: QueryList<ElementRef>): void {
    // Set the options for the service
    // Set the width and height of the story container
    storyContainers?.forEach(storyContainer => {
      storyContainer.nativeElement.style.width = options.width + 'px';
      storyContainer.nativeElement.style.height = options.height + 'px';
    });

  }
}
