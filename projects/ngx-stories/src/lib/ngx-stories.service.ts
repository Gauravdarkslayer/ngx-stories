import { Injectable } from "@angular/core";
import { Person } from "./interfaces/interfaces";
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

  nextStory(persons: Person[], currentPersonIndex: number, currentStoryIndex: number): { personIndex: number, storyIndex: number } {
    let stories = persons[currentPersonIndex]?.stories;
    if (currentStoryIndex === stories.length - 1) {
      // Move to the next person if the current story index is the last
      currentPersonIndex = (currentPersonIndex + 1) % persons.length;
      currentStoryIndex = 0;
    } else {
      // Otherwise, just move to the next story within the same person
      currentStoryIndex++;
    }
    return { personIndex: currentPersonIndex, storyIndex: currentStoryIndex };
  }

  prevStory(persons: any[], currentPersonIndex: number, currentStoryIndex: number): { personIndex: number, storyIndex: number } {
    let stories = persons[currentPersonIndex]?.stories;
    if (currentStoryIndex === 0) {
      // Move to the previous person if the current story index is 0
      if (currentPersonIndex > 0) {
        currentPersonIndex--;
        stories = persons[currentPersonIndex]?.stories;
        currentStoryIndex = stories.length - 1;
      }
    } else {
      // Otherwise, just move to the previous story within the same person
      currentStoryIndex--;
    }
    return { personIndex: currentPersonIndex, storyIndex: currentStoryIndex };
  }
}
