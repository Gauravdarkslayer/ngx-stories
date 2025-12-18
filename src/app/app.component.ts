import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxStoriesComponent, NgxStoriesOptions, StoryGroup } from '../../projects/ngx-stories/src/public-api';
import { CustomComponentComponent } from './components/custom-component/custom-component.component';
import { BackgroundEffectComponent } from './components/background-effect/background-effect.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxStoriesComponent, CommonModule, BackgroundEffectComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  installIcon: string = 'assets/images/copy.png';
  isCopied: boolean = false;
  storyOptions: NgxStoriesOptions = {
    // Tweak these options as needed
    // width: 338,
    // height: 600,
    // currentStoryIndex: 0,
    // currentStoryGroupIndex: 0,
    backlitColor: '#000',
    enableGradientBackground: true
  };
  readonly storyGroups: StoryGroup[] = [
    {
      name: 'Steve Smith',
      stories: [
        { type: 'image', content: 'https://i.ibb.co/ZMVy3KN/pexels-rpnickson-2486168.jpg' },
        { type: 'component', content: CustomComponentComponent },
        { type: 'video', content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { type: 'video', content: 'https://videos.pexels.com/video-files/30809324/13177170_1080_1920_30fps.mp4' },
        { type: 'video', content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
        { type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/3.jpg' }
      ]
    },
    {
      name: 'John Doe',
      stories: [
        { type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/4.jpg' },
        { type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/5.jpg' },
        { type: 'video', content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { type: 'video', content: 'https://videos.pexels.com/video-files/29371135/12653510_2560_1440_60fps.mp4' },
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
    navigator.clipboard.writeText('npm i ngx-stories');
    this.isCopied = true;
    setTimeout(() => {
      this.isCopied = false;
    }, 2000);
  }
}
