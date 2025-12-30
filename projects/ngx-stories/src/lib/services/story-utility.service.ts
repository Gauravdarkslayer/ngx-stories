import { ElementRef, Injectable, QueryList, Type, ViewContainerRef } from '@angular/core';
import { NgxStoriesOptions, StoryGroup } from '../interfaces/interfaces';
import { generateUniqueId } from '../utils/id-generator';

/**
 * Internal utility service for ngx-stories component.
 *
 * This service handles story navigation helper logic, progress timing, 
 * and various utility functions for the stories viewer.
 *
 * @internal
 */
@Injectable()
export class StoryUtilityService {
    /**
     * Starts a repeating interval for story progress updates.
     * @param intervalMs - Milliseconds between each callback invocation
     * @param callback - Function to call on each tick
     * @returns The interval ID for cleanup
     */
    startProgress(intervalMs: number, callback: () => void): ReturnType<typeof setInterval> {
        return setInterval(() => callback(), intervalMs);
    }

    /**
     * Calculates the next story position when navigating forward.
     * @param storyGroups - All story groups
     * @param currentStoryGroupIndex - Current group index
     * @param currentStoryIndex - Current story index within group
     * @param onStoryGroupChange - Callback when group changes
     * @returns New group and story indices
     */
    nextStory(
        storyGroups: StoryGroup[],
        currentStoryGroupIndex: number,
        currentStoryIndex: number,
        onStoryGroupChange: (storyGroupIndex: number) => void
    ): { storyGroupIndex: number; storyIndex: number } {
        const stories = storyGroups[currentStoryGroupIndex]?.stories;

        // Defensive guard: if stories is missing or empty, treat group as empty and advance
        if (!stories || stories.length === 0) {
            currentStoryGroupIndex = currentStoryGroupIndex + 1;
            currentStoryIndex = 0;
            if (currentStoryGroupIndex < storyGroups.length) {
                onStoryGroupChange(currentStoryGroupIndex);
            }
            return { storyGroupIndex: currentStoryGroupIndex, storyIndex: currentStoryIndex };
        }

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

    /**
     * Calculates the previous story position when navigating backward.
     * @param storyGroups - All story groups
     * @param currentStoryGroupIndex - Current group index
     * @param currentStoryIndex - Current story index within group
     * @param onStoryGroupChange - Callback when group changes
     * @returns New group and story indices
     */
    prevStory(
        storyGroups: StoryGroup[],
        currentStoryGroupIndex: number,
        currentStoryIndex: number,
        onStoryGroupChange: (storyGroupIndex: number) => void
    ): { storyGroupIndex: number; storyIndex: number } {
        let stories = storyGroups[currentStoryGroupIndex]?.stories;

        // Defensive guard: if stories is missing or empty at current position
        if (!stories || stories.length === 0) {
            if (currentStoryGroupIndex > 0) {
                currentStoryGroupIndex--;
                currentStoryIndex = 0;
                onStoryGroupChange(currentStoryGroupIndex);
            }
            return { storyGroupIndex: currentStoryGroupIndex, storyIndex: currentStoryIndex };
        }

        if (currentStoryIndex === 0) {
            // Move to the previous storyGroup if the current story index is 0
            if (currentStoryGroupIndex > 0) {
                currentStoryGroupIndex--;
                stories = storyGroups[currentStoryGroupIndex]?.stories;
                // Guard against empty stories array in previous group
                if (!stories || stories.length === 0) {
                    currentStoryIndex = 0;
                } else {
                    currentStoryIndex = stories.length - 1;
                }
                onStoryGroupChange(currentStoryGroupIndex);
            }
        } else {
            // Otherwise, just move to the previous story within the same storyGroup
            currentStoryIndex--;
        }
        return { storyGroupIndex: currentStoryGroupIndex, storyIndex: currentStoryIndex };
    }

    /**
     * Applies dimension options to story containers.
     * @param options - Configuration options
     * @param storyContainers - List of story container elements
     */
    setOptions(options: NgxStoriesOptions, storyContainers: QueryList<ElementRef>): void {
        storyContainers?.forEach(storyContainer => {
            storyContainer.nativeElement.style.width = options.width + 'px';
            storyContainer.nativeElement.style.height = options.height + 'px';
        });
    }

    /**
     * Checks if an image is already cached in the browser.
     * @param src - Image URL to check
     * @returns True if image is cached and immediately available
     */
    isImageCached(src: string): boolean {
        const img = new Image();
        img.src = src;
        return img.complete;
    }

    /**
     * Dynamically creates and injects a component into a container.
     * @param containerRef - The ViewContainerRef where the component should be injected
     * @param component - The component class to instantiate
     * @returns The component instance
     */
    renderComponent<T>(containerRef: ViewContainerRef, component: Type<T>): T {
        containerRef?.clear();
        const componentRef = containerRef?.createComponent(component);
        return componentRef?.instance;
    }

    /**
     * Assigns unique IDs to story groups and stories that don't have them.
     * This ensures proper tracking in Angular's @for loops.
     * 
     * **⚠️ MUTATES INPUT**: This method modifies the input array in place for performance.
     * If you need the original array unchanged, pass a deep copy instead.
     * 
     * @param storyGroups - Story groups to process (will be mutated)
     * @returns The same array reference with IDs assigned
     */
    assignIdsIfMissing(storyGroups: StoryGroup[]): StoryGroup[] {
        for (const storyGroup of storyGroups) {
            storyGroup.id = storyGroup.id ?? generateUniqueId();
            for (const story of storyGroup.stories) {
                story.id = story.id ?? generateUniqueId();
            }
        }
        return storyGroups;
    }

    /**
     * Parses a color string (hex or rgb) into RGB components.
     * @param colorStr - Color in hex (#fff or #ffffff) or rgb(r,g,b) format
     * @returns Array of [r, g, b] values (0-255)
     */
    parseColor(colorStr: string): number[] {
        if (colorStr.startsWith('rgb')) {
            const parts = colorStr.match(/\d+/g);
            if (parts && parts.length >= 3) {
                return [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])];
            }
        } else if (colorStr.startsWith('#')) {
            let hex = colorStr.substring(1);
            // Expand 3-char shorthand to 6-char
            if (hex.length === 3) {
                hex = hex.split('').map(c => c + c).join('');
            }
            const bigint = parseInt(hex, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return [r, g, b];
        }
        return [0, 0, 0]; // Default black
    }

    /**
     * Linear interpolation between two values.
     * @param start - Starting value
     * @param end - Ending value
     * @param t - Interpolation factor (0-1)
     * @returns Interpolated value
     */
    lerp(start: number, end: number, t: number): number {
        return start * (1 - t) + end * t;
    }

    /**
     * Linear interpolation between two RGB colors.
     * @param start - Starting color [r, g, b]
     * @param end - Ending color [r, g, b]
     * @param t - Interpolation factor (0-1)
     * @returns Interpolated color [r, g, b]
     */
    lerpColor(start: number[], end: number[], t: number): number[] {
        return [
            this.lerp(start[0], end[0], t),
            this.lerp(start[1], end[1], t),
            this.lerp(start[2], end[2], t)
        ];
    }

    /**
     * Gets the default parsed colors based on options.
     * @param options - Component options
     * @returns Two identical colors for gradient fallback
     */
    getDefaultParsedColors(options: NgxStoriesOptions): number[][] {
        const defaultColor = options?.backlitColor || '#1b1b1b';
        const parsed = this.parseColor(defaultColor);
        return [parsed, parsed];
    }
}
