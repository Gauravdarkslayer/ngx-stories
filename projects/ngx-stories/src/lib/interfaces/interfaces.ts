import { Component, Type } from "@angular/core";

export type StoryType = 'image' | 'video' | 'component';
export type StoryStateType = 'playing' | 'paused' | 'holding' | 'buffering' ;
export interface Story {
    id: number,
    type: StoryType,
    content: string | Type<Component>,
}

export interface StoryGroup {
    id: number, // unique id
    name: string, // name of the storyGroup which is to be displayed over story
    stories: Story[] // array of stories
}

export interface NgxStoriesOptions {
    width?: number,
    height?: number,
    currentStoryIndex?: number,
    currentStoryGroupIndex?: number,
    backlitColor?: string
}