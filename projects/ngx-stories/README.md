# Ngx Stories

An Angular component to render instagram like stories.

[![npm downloads](https://img.shields.io/npm/dt/ngx-stories)](https://www.npmjs.com/package/ngx-stories)
[![npm version](https://img.shields.io/npm/v/ngx-stories)](https://www.npmjs.com/package/ngx-stories)


## For Version 17+

## Installation

Install the library via npm:

```bash
npm install ngx-stories
```

```ts
import { NgxStoriesComponent, StoryGroup } from 'ngx-stories';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxStoriesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  storyGroups: StoryGroup[] = [
      {
        id: 1,
        name: 'John Doe',
        stories: [
          { id: 101, type: 'image', content: 'https://example.com/story1.jpg' },
        ],
      },
      {
        id: 2,
        name: 'Jane Smith',
        stories: [
          { id: 103, type: 'image', content: 'https://example.com/story3.jpg' },
          { id: 3, type: 'video', content: 'https://example.com/video-story.mp4' },
        ],
      },
    ];
  }
```

```html
<ngx-stories [storyGroups]="storyGroups"></ngx-stories>
```

## Properties
| Property           | Type                  | Required | Description                                                                                                  |
|--------------------|-----------------------|----------|--------------------------------------------------------------------------------------------------------------|
| `storyGroups`      | `StoryGroup[]`        | Yes      | An input property that accepts an array of story groups. Each group contains a list of stories to display.     |
| `options`          | `NgxStoriesOptions`   | No       | Configuration options for the story display. Options include `width` and `height` to customize the dimensions. |
| `backlitColor`          | `String`   | No       | Background color for stories by default it's `#1b1b1b`. |
| `triggerOnEnd`     | `EventEmitter<void>`  | No       | Output event that is triggered when the user reaches the end of all stories.                                  |
| `triggerOnExit`    | `EventEmitter<void>`  | No       | Output event that is triggered when the user manually exits the story view.                                   |
| `triggerOnSwipeUp` | `EventEmitter<void>`  | No       | Output event that is triggered when the user performs a swipe-up gesture, typically for additional actions.    |
| `onStoryGroupChange` | `EventEmitter<number>`  | No       | Output event that is triggered when the user changes the storyGroup.


```ts
interface NgxStoriesOptions {
  width: number, // width of story
  height: number, // height of story
  currentStoryIndex: 0, // index from where stories should start
  currentStoryGroupIndex: 0 // index from where story group should start
}
```

## Features
* Dynamic Story Carousel: Display a collection of stories for each storyGroup.
* Easy Integration: Simple and straightforward to integrate into your Angular project.
* Story Progress Tracker: Track the progress of each story as the user navigates through the stories.
* Swipe Gestures (Mobile Friendly): Allow users to swipe left or right to navigate through the stories.
* Hold to Pause: Pause the story progress when the user holds their finger on the screen.
* Events: Trigger events when the user reaches the end of the stories or when they exit the carousel.
* Keyboard navigation

## Contributing
[Contributing Guide](https://github.com/Gauravdarkslayer/ngx-stories/blob/main/CONTRIBUTING.md)

## License
This library is licensed under the MIT License. Feel free to use and modify the code as per your needs.
