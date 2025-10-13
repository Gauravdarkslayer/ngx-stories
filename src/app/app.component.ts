import { Component, ViewChild, AfterViewInit } from '@angular/core';
import {
  NgxStoriesComponent,
  NgxStoriesOptions,
  StoryGroup
} from '../../projects/ngx-stories/src/public-api';
import { CustomComponentComponent } from './components/custom-component/custom-component.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxStoriesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {
  installIcon: string = 'assets/images/copy.png';

  // Access to the NgxStories component
  @ViewChild(NgxStoriesComponent) ngxStoriesComponent!: NgxStoriesComponent;

  storyOptions: NgxStoriesOptions = {
    backlitColor: '#1b1b1b'
  };

  readonly storyGroups: StoryGroup[] = [
    {
      name: 'Steve Smith',
      stories: [
        { type: 'image', content: 'https://i.ibb.co/ZMVy3KN/pexels-rpnickson-2486168.jpg' },
        { type: 'component', content: CustomComponentComponent },
        { type: 'video', content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { type: 'video', content: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        { type: 'video', content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
        { type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/3.jpg' }
      ]
    },
    {
      name: 'John Doe',
      stories: [
        { type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/4.jpg' },
        { type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/5.jpg' },
        { type: 'video', content: 'https://videos.pexels.com/video-files/28759029/12469290_1920_1080_25fps.mp4' },
        { type: 'video', content: 'https://videos.pexels.com/video-files/28985119/12537126_1920_1080_24fps.mp4' },
        { type: 'video', content: 'https://videos.pexels.com/video-files/28496760/12399731_1440_2560_30fps.mp4' }
      ]
    },
  ];

  ngAfterViewInit() {
    // Handle tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.ngxStoriesComponent?.pauseStory();
      } else {
        this.ngxStoriesComponent?.resumeStory();
      }
    });
  }

  triggerOnEnd() {
    console.log('End');
  }

  triggerOnExit() {
    console.log('Exit');
  }

  triggerOnStoryGroupChange(storyGroup: number) {
    console.log('currentStoryGroupDetails', storyGroup);
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
