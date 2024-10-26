import { Type, } from "@angular/core";

export type StoryType = 'image' | 'video';
export interface Story {
    id: number,
    type: StoryType,
    title?: string;
    content?: string;
    imageUrl?: string;
    videoUrl?: string;
    component?: Type<any>;
}

export interface Person {
    id: number, // unique id
    name: string, // name of the person which is to be displayed over story
    stories: Story[] // array of stories
}
