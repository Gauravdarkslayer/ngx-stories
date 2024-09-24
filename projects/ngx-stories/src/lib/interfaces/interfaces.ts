export type StoryType = 'image' | 'video';
export interface Story {
    id: number,
    type: StoryType,
    content: string,
}

export interface StoryGroup {
    id: number, // unique id
    name: string, // name of the storyGroup which is to be displayed over story
    stories: Story[] // array of stories
}

export interface NgxStoriesOptions {
    width: number,
    height: number,
}