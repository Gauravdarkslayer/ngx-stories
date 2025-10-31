import { Component, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxStoriesComponent, NgxStoriesOptions, StoryGroup } from '../../projects/ngx-stories/src/public-api';
import { CustomComponentComponent } from './components/custom-component/custom-component.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxStoriesComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  isCopied: boolean = false;
  storyOptions: NgxStoriesOptions = {
    // Tweak these options as needed
    // width: 338,
    // height: 600,
    // currentStoryIndex: 0,
    // currentStoryGroupIndex: 0,
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
    navigator.clipboard.writeText('npm i ngx-stories').then(() => {
      this.isCopied = true;
      setTimeout(() => {
        this.isCopied = false;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }
}
