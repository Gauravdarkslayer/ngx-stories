import { Component } from '@angular/core';
import { NgxStoriesComponent, NgxStoriesOptions, StoryGroup } from '../../projects/ngx-stories/src/public-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxStoriesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  installIcon: string = 'assets/images/copy.png';
  storyOptions: NgxStoriesOptions = {
    width: 338,
    height: 600,
    currentStoryIndex: 0,
    currentStoryGroupIndex: 0
  };
  readonly storyGroups: StoryGroup[] = [
    {
      id: 1,
      name: 'Steve Smith',
      stories: [
        { id: 1, type: 'image', content: 'https://i.ibb.co/ZMVy3KN/pexels-rpnickson-2486168.jpg' },
        { id: 2, type: 'video', content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { id: 3, type: 'video', content: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        { id: 4, type: 'video', content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
        { id: 5, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/3.jpg' }
      ]
    },
    {
      id: 2,
      name: 'John Doe',
      stories: [
        { id: 1, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/4.jpg' },
        { id: 2, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/5.jpg' },
        { id: 3, type: 'video', content: 'https://videos.pexels.com/video-files/28759029/12469290_1920_1080_25fps.mp4' },
        { id: 4, type: 'video', content: 'https://videos.pexels.com/video-files/28985119/12537126_1920_1080_24fps.mp4' },
        { id: 5, type: 'video', content: 'https://videos.pexels.com/video-files/28496760/12399731_1440_2560_30fps.mp4' }
      ]
    },
  ];

  triggerOnEnd() {
    console.log('End');
  }

  triggerOnExit() {
    console.log('Exit');
  }

  triggerOnStoryGroupChange(storyGroup: number) {
    console.log('currentStoryGroupDetails',storyGroup);
  }

  currentStoryDetails(eventData: object) {
    console.log('currentStoryDetails', eventData);
  }

  copyCommand() {
    navigator.clipboard.writeText('npm i ngx-stories');
    this.installIcon = 'assets/images/copy-done.svg';
    setTimeout(() => {
      this.installIcon = 'assets/images/copy.png';
    }, 3000);
  }
}
