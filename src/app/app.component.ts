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
      id: 2,
      name: 'John Doe',
      stories: [
        { id: 1, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/4.jpg' },
        { id: 2, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/5.jpg' },
        { id: 3, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/6.jpg' },
        { id: 4, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/7.jpg' }
      ]
    },
  ];

  triggerOnEnd() {
    alert('Stories Ended !!');
  }

  triggerOnExit() {
    alert('Exit');
  }
}
