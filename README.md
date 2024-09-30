# Ngx Stories

An Angular library for displaying user stories in a carousel format.

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
| `triggerOnEnd`     | `EventEmitter<void>`  | No       | Output event that is triggered when the user reaches the end of all stories.                                  |
| `triggerOnExit`    | `EventEmitter<void>`  | No       | Output event that is triggered when the user manually exits the story view.                                   |
| `triggerOnSwipeUp` | `EventEmitter<void>`  | No       | Output event that is triggered when the user performs a swipe-up gesture, typically for additional actions.    |


## Features
* Dynamic Story Carousel: Display a collection of stories for each storyGroup.
* Easy Integration: Simple and straightforward to integrate into your Angular project.
* Story Progress Tracker: Track the progress of each story as the user navigates through the stories.
* Swipe Gestures (Mobile Friendly): Allow users to swipe left or right to navigate through the stories.
* Hold to Pause: Pause the story progress when the user holds their finger on the screen.
* Events: Trigger events when the user reaches the end of the stories or when they exit the carousel.

## License
This library is licensed under the MIT License. Feel free to use and modify the code as per your needs.
