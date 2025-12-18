import { Component, Type } from "@angular/core";

export type StoryType = 'image' | 'video' | 'component';
export type StoryStateType = 'playing' | 'paused' | 'holding' | 'buffering';
export interface Story {
    id?: string,
    type: StoryType,
    content: string | Type<Component>,
    crossOrigin?: 'anonymous' | 'use-credentials' | '' | null;
}

export interface StoryGroup {
    id?: string, // unique id
    name: string, // name of the storyGroup which is to be displayed over story
    stories: Story[] // array of stories
}

export interface NgxStoriesOptions {
    width?: number,
    height?: number,
    currentStoryIndex?: number,
    currentStoryGroupIndex?: number,
    backlitColor?: string,
    enableGradientBackground?: boolean
}