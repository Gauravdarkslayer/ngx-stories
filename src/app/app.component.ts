// Import necessary modules from Angular and NgxStories library
import { Component } from '@angular/core';
import { NgxStoriesComponent, StoryGroup } from '../../projects/ngx-stories/src/public-api';

// Define the AppComponent with metadata like selector, template, and style URL
@Component({
  selector: 'app-root', // The component's HTML tag
  standalone: true,     // Indicates this component does not require being declared in a module
  imports: [NgxStoriesComponent],  // Importing the NgxStoriesComponent
  templateUrl: './app.component.html',  // External HTML template for the component
  styleUrl: './app.component.css',      // External CSS for styling the component
})

// Export the AppComponent class, the main component of the application
export class AppComponent {

  // Defining an array of story groups, each containing a group of stories for users
  // StoryGroup[] is a list where each story group contains an id, name, and an array of stories
  readonly storyGroups: StoryGroup[] = [
    {
      id: 1,
      name: 'Steve Smith',
      stories: [
        { id: 1, type: 'image', content: 'https://i.ibb.co/ZMVy3KN/pexels-rpnickson-2486168.jpg' },
        { id: 2, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/2.jpg' },
        { id: 3, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/3.jpg' }
      ]
    },
    {
      id: 2,         // Unique identifier for the second story group
      name: 'John Doe',  // Name of the second group
      stories: [     // Array of stories belonging to this group
        { id: 1, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/4.jpg' }, //Story 1
        { id: 2, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/5.jpg' }, //Story 2
        { id: 3, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/6.jpg' }, //Story 3
        { id: 4, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/7.jpg' }  //Story 4
      ]
    },
  ];

  // Function to trigger an alert when the user reaches the end of the stories
  triggerOnEnd() {
    alert('End');  // Displays an alert with the message "End"
  }

  // Function to trigger an alert when the user exits the stories
  triggerOnExit() {
    alert('Exit');  // Displays an alert with the message "Exit"
  }

  triggerOnStoryGroupChange(storyGroup: number) {
    console.log(storyGroup);
  }
}
