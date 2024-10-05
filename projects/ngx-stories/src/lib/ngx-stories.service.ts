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
  clearProgress(intervalId: any): void {
    clearInterval(intervalId);
  }

  nextStory(storyGroups: StoryGroup[],
    currentStoryGroupIndex: number,
    currentStoryIndex: number,
    onStoryGroupChange: (storyGroupIndex: number) => void): { storyGroupIndex: number, storyIndex: number } {
    let stories = storyGroups[currentStoryGroupIndex]?.stories;
    if (currentStoryIndex === stories.length - 1) {
      currentStoryGroupIndex = (currentStoryGroupIndex + 1) % storyGroups.length;
      currentStoryIndex = 0;
      onStoryGroupChange(currentStoryGroupIndex);
    } else {
      currentStoryIndex++;
    }
    return { storyGroupIndex: currentStoryGroupIndex, storyIndex: currentStoryIndex };
  }
// Array of story groups
  prevStory(storyGroups: StoryGroup[], 
    currentStoryGroupIndex: number,
    currentStoryIndex: number,
    onStoryGroupChange: (storyGroupIndex: number) => void): { storyGroupIndex: number, storyIndex: number } {
    let stories = storyGroups[currentStoryGroupIndex]?.stories;
    if (currentStoryIndex === 0) {
      if (currentStoryGroupIndex > 0) {
        currentStoryGroupIndex--;
        stories = storyGroups[currentStoryGroupIndex]?.stories;
        currentStoryIndex = stories.length - 1;
        onStoryGroupChange(currentStoryGroupIndex);
      }
    } else {
      currentStoryIndex--;
    }
    return { storyGroupIndex: currentStoryGroupIndex, storyIndex: currentStoryIndex };
  }
 // Set the options for the service
  setOptions(options: NgxStoriesOptions, storyContainers: QueryList<ElementRef>): void {  
    storyContainers?.forEach(storyContainer => {
      storyContainer.nativeElement.style.width = options.width + 'px';
      storyContainer.nativeElement.style.height = options.height + 'px';
    });

  }
}
