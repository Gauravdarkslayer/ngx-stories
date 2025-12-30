import { Type } from '@angular/core';

/**
 * Supported content types for a story.
 * - `image`: Static image URL
 * - `video`: Video URL (mp4, webm, etc.)
 * - `component`: Dynamic Angular component
 */
export type StoryType = 'image' | 'video' | 'component';

/**
 * Playback state of the stories viewer.
 */
export type StoryStateType = 'playing' | 'paused' | 'holding' | 'buffering';

/**
 * Represents a single story item within a story group.
 *
 * @example
 * // Image story
 * { type: 'image', content: 'https://example.com/photo.jpg' }
 *
 * // Video story
 * { type: 'video', content: 'https://example.com/clip.mp4' }
 *
 * // Component story
 * { type: 'component', content: MyCustomComponent }
 */
export interface Story {
    /** Unique identifier. Auto-generated if not provided. */
    id?: string;

    /** The type of content this story displays. */
    type: StoryType;

    /**
     * The content to display.
     * - For `image` and `video` types: URL string
     * - For `component` type: Angular component class
     */
    content: string | Type<unknown>;

    /**
     * CORS setting for image/video elements.
     * Set to `null` to omit the attribute entirely.
     * @default 'anonymous'
     */
    crossOrigin?: 'anonymous' | 'use-credentials' | '' | null;
}

/**
 * Represents a group of stories belonging to a single entity (e.g., user, brand).
 *
 * @example
 * {
 *   name: 'John Doe',
 *   stories: [
 *     { type: 'image', content: 'https://example.com/story1.jpg' },
 *     { type: 'video', content: 'https://example.com/story2.mp4' }
 *   ]
 * }
 */
export interface StoryGroup {
    /** Unique identifier. Auto-generated if not provided. */
    id?: string;

    /** Display name shown above the story content. */
    name: string;

    /** Array of stories in this group. */
    stories: Story[];
}

/**
 * Configuration options for the ngx-stories component.
 */
export interface NgxStoriesOptions {
    /** Width of the story container in pixels. @default 338 */
    width?: number;

    /** Height of the story container in pixels. @default 600 */
    height?: number;

    /** Initial story index to display. @default 0 */
    currentStoryIndex?: number;

    /** Initial story group index to display. @default 0 */
    currentStoryGroupIndex?: number;

    /** Background color when gradient is disabled or for component stories. @default '#1b1b1b' */
    backlitColor?: string;

    /** Enable dynamic gradient background based on content colors. @default true */
    enableGradientBackground?: boolean;
}

/**
 * Payload emitted by the `triggerOnStoryChange` event.
 */
export interface StoryChangeEventData {
    /** Name of the current story group. */
    currentPerson: string;

    /** Index of the current story group. */
    currentPersonIndex: number;

    /** The currently active story. */
    currentStory: Story;

    /** Index of the current story within its group. */
    currentStoryIndex: number;

    /** The previously active story, or null if this is the first story. */
    previousStory: Story | null;

    /** Index of the previous story, or null if this is the first story. */
    previousStoryIndex: number | null;
}