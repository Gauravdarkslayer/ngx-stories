import { Component } from '@angular/core';
import { NgxStoriesComponent, StoryGroup } from '../../projects/ngx-stories/src/public-api';

@Component({
  selector: 'app-root', 
  standalone: true,    
  imports: [NgxStoriesComponent], 
  templateUrl: './app.component.html',  
  styleUrl: './app.component.css',
})
export class AppComponent {

  // StoryGroup[] is a list where each story group contains an id, name, and an array of stories
  readonly storyGroups: StoryGroup[] = [
    {
      id: 1,
      name: 'Steve Smith',
      stories: [
        { id: 1, type: 'image', content: 'https://i.ibb.co/ZMVy3KN/pexels-rpnickson-2486168.jpg' },
        { id: 2, type: 'video', content: 'https://videos.pexels.com/video-files/3468587/3468587-uhd_1440_2560_30fps.mp4' },
        { id: 3, type: 'video', content: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        { id: 4, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/3.jpg' }
      ]
    },
    {
      id: 2,        
      name: 'John Doe',
      stories: [     // Array of stories belonging to this group
        { id: 1, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/4.jpg' }, 
        { id: 2, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/5.jpg' }, 
        { id: 3, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/6.jpg' }, 
        { id: 4, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/7.jpg' }  
      ]
    },
  ];

  // Function to trigger an alert when the user reaches the end of the stories
  triggerOnEnd() {
    alert('End'); 
  }

  // Function to trigger an alert when the user exits the stories
  triggerOnExit() {
    alert('Exit');  
  }

  // Function to console log when the user changes the story group
  triggerOnStoryGroupChange(storyGroup: number) {
    console.log(storyGroup);
  }
}
