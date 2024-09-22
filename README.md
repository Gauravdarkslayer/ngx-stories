# Ngx Stories

An Angular library for displaying user stories in a carousel format.


## For Version 17+

## Installation

Install the library via npm:

```bash
npm install ngx-stories
```

```ts
import { NgxStoriesComponent } from 'ngx-stories';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxStoriesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  storyGroups = [
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

## Features
* Dynamic Story Carousel: Display a collection of stories for each storyGroup.
* Easy Integration: Simple and straightforward to integrate into your Angular project.
* Story Progress Tracker: Track the progress of each story as the user navigates through the stories.
* Swipe Gestures (Mobile Friendly): Allow users to swipe left or right to navigate through the stories.
* Hold to Pause: Pause the story progress when the user holds their finger on the screen.
* Events: Trigger events when the user reaches the end of the stories or when they exit the carousel.

## License
This library is licensed under the MIT License. Feel free to use and modify the code as per your needs.