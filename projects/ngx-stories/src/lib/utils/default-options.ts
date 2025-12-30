import { NgxStoriesOptions } from '../interfaces/interfaces';

/**
 * Default configuration options for the ngx-stories component.
 * These values are used when no options are provided by the consumer.
 */
export const DEFAULT_STORIES_OPTIONS: Required<NgxStoriesOptions> = {
  width: 338,
  height: 600,
  currentStoryIndex: 0,
  currentStoryGroupIndex: 0,
  backlitColor: '#1b1b1b',
  enableGradientBackground: true
};