/**
 * Public API Surface of ngx-stories
 *
 * This file defines the public API of the library. Only symbols exported here
 * are considered part of the stable API and are safe to import by consumers.
 */

// Main component
export { NgxStoriesComponent } from './lib/ngx-stories.component';

// Public interfaces and types (using 'export type' for isolatedModules compatibility)
export type {
    Story,
    StoryGroup,
    StoryType,
    StoryStateType,
    NgxStoriesOptions,
    StoryChangeEventData
} from './lib/interfaces/interfaces';

// Default options constant (for consumers who want to extend defaults)
export { DEFAULT_STORIES_OPTIONS } from './lib/utils/default-options';