export type StoryType = 'image' | 'video';
export interface Story {
    id: number,
    type: StoryType,
    content: string,
}
// StoryGroup interface
export interface StoryGroup {
    id: number,
    name: string, 
    stories: Story[] 
}
// NgxStoriesOptions interface
export interface NgxStoriesOptions {
    width: number,
    height: number,
}