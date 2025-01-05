import { ElementRef, Injectable, QueryList, Type, ViewContainerRef } from "@angular/core";
import { NgxStoriesOptions, StoryGroup } from "./interfaces/interfaces";
import { generateUniqueId } from "./utils/id-generator";
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

  isImageCached(src: string): boolean {
    const img = new Image();
    img.src = src;
    return img.complete;
  }

  /**
  * Dynamically creates and injects a component into the specified ViewContainerRef.
  * @param containerRef The ViewContainerRef where the component should be injected.
  * @param component The component class (Type) to be dynamically created.
  */
  renderComponent<T>(
    containerRef: ViewContainerRef,
    component: Type<T>,
  ): T {
    // Clear previous components in the container (if any)
    containerRef?.clear();

    const componentRef = containerRef.createComponent(component);
    return componentRef.instance;
  }

  /**
   * Assigns unique ids to storyGroups and stories if they are missing.
  */
  assignIdsIfMissing(storyGroups: StoryGroup[]): StoryGroup[] {
    for (const storyGroup of storyGroups) {
      storyGroup.id = storyGroup.id || generateUniqueId();
      for (const story of storyGroup.stories) {
        story.id = story.id || generateUniqueId();
      }
    }
    return storyGroups;
  }
}
