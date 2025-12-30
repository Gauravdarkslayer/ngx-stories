import { Injectable } from '@angular/core';
import { Story, StoryGroup, StoryStateType, NgxStoriesOptions } from '../interfaces/interfaces';
import { DEFAULT_STORIES_OPTIONS } from '../utils/default-options';
import { StoryUtilityService } from './story-utility.service';

/**
 * Service to manage the state and navigation of stories.
 * This helps in decoupling the state management from the NgxStoriesComponent.
 */
@Injectable()
export class StoryStateService {
    storyGroups: StoryGroup[] = [];
    currentStoryIndex = 0;
    currentStoryGroupIndex = 0;
    storyState: StoryStateType = 'playing';
    options: NgxStoriesOptions = {};

    constructor(private storyService: StoryUtilityService) { }

    /**
     * Initializes the state with story groups and options.
     */
    initialize(storyGroups: StoryGroup[], options: NgxStoriesOptions): void {
        this.storyGroups = this.storyService.assignIdsIfMissing(storyGroups);
        this.options = { ...DEFAULT_STORIES_OPTIONS, ...options };
        this.currentStoryIndex = this.options.currentStoryIndex ?? 0;
        this.currentStoryGroupIndex = this.options.currentStoryGroupIndex ?? 0;
    }

    /**
     * Navigates to the next or previous story.
     */
    navigate(direction: 'next' | 'previous', onGroupChange: (idx: number) => void): { storyGroupIndex: number; storyIndex: number } {
        const { storyGroupIndex, storyIndex } = direction === 'next'
            ? this.storyService.nextStory(this.storyGroups, this.currentStoryGroupIndex, this.currentStoryIndex, onGroupChange)
            : this.storyService.prevStory(this.storyGroups, this.currentStoryGroupIndex, this.currentStoryIndex, onGroupChange);

        this.currentStoryIndex = storyIndex;
        this.currentStoryGroupIndex = storyGroupIndex;
        return { storyGroupIndex, storyIndex };
    }

    /**
     * Updates the current playback state.
     */
    setState(state: StoryStateType): void {
        this.storyState = state;
    }

    /**
     * Checks if we've reached the end of all stories.
     */
    isAtEnd(): boolean {
        return this.currentStoryGroupIndex === this.storyGroups.length;
    }

    /**
     * Gets the currently active story.
     */
    getCurrentStory(): Story | null {
        const group = this.storyGroups[this.currentStoryGroupIndex];
        return group ? group.stories[this.currentStoryIndex] : null;
    }
}
