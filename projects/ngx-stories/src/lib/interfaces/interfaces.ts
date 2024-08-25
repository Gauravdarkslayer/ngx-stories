export interface Story {
    id: number,
    type: String,
    content: String,
}

export interface Person {
    id: number,
    name: String,
    stories: Story[]
}
