import { AfterViewInit, Component, ElementRef, Injectable, QueryList, Renderer2, ViewChildren } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule } from '@angular/platform-browser';
declare var Hammer: any;

@Injectable()
export class MyHammerConfig extends HammerGestureConfig {
  override overrides = {
    swipe: { direction: Hammer.DIRECTION_HORIZONTAL },
  };
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HammerModule],
  providers: [
    { provide: HAMMER_GESTURE_CONFIG, useClass: MyHammerConfig }
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {
  title = 'story-component';
  readonly persons = [
    {
      id: 1,
      name: 'Gaurav',
      stories: [
        { id: 1, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/1.jpg' },
        { id: 2, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/2.jpg' },
        { id: 3, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/3.jpg' }
      ]
    },
    {
      id: 2,
      name: 'Rajesh',
      stories: [
        { id: 1, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/4.jpg' },
        { id: 2, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/5.jpg' },
        { id: 3, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/6.jpg' },
        { id: 4, type: 'image', content: 'https://d38b044pevnwc9.cloudfront.net/cutout-nuxt/enhancer/7.jpg' }
      ]
    },
  ];
  currentStoryIndex: number = 0;
  currentPersonIndex: number = 0;
  progressWidth: number = 0;
  intervalId: any;
  isTransitioning = false;
  isSwipingLeft = false;
  isSwipingRight = false;
  isHolding = false;
  @ViewChildren('storyContainer') storyContainers!: QueryList<ElementRef>;

  constructor(
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.startStoryProgress();

  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  ngAfterViewInit(): void {
    this.initHammer();
  }

  startStoryProgress() {
    this.intervalId && clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.progressWidth += 1;
      if (this.progressWidth >= 100) {
        this.nextStory();
      }
    }, 50);
  }

  initHammer() {
    this.storyContainers?.forEach(storyContainer => {
      const hammer = new Hammer(storyContainer.nativeElement);
      hammer.on('swipeleft', () => this.handleSwipe('left'));
      hammer.on('swiperight', () => this.handleSwipe('right'));
    });
  }

  handleSwipe(direction: string) {
    if (direction === 'left') {
      this.isSwipingLeft = true;
      setTimeout(() => {
        this.nextPersonStory();
        this.resetSwipe();
      }, 600); // Match the animation duration
    } else if (direction === 'right') {
      this.isSwipingRight = true;
      setTimeout(() => {
        this.prevPersonStory();
        this.resetSwipe();
      }, 600); // Match the animation duration
    }
  }

  resetSwipe() {
    this.isSwipingLeft = false;
    this.isSwipingRight = false;
  }

  nextStory() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    clearInterval(this.intervalId);
    let stories = this.persons.find((person, index) => index === this.currentPersonIndex)?.stories;
    console.log(stories?.length, this.currentStoryIndex);

    if (Number(stories?.length) - 1 === this.currentStoryIndex) {
      this.currentPersonIndex = (this.currentPersonIndex + 1) % this.persons.length;
      stories = this.persons.find((person, index) => index === this.currentPersonIndex)?.stories;
      this.currentStoryIndex = 0;
    } else {
      this.currentStoryIndex = (this.currentStoryIndex + 1) % stories!.length;
    }
    this.progressWidth = 0;
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, 500); // Match this timeout with the CSS transition duration
  }

  prevStory() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    clearInterval(this.intervalId);
    let stories = this.persons.find((person, index) => index === this.currentPersonIndex)?.stories;
    console.log(stories?.length, this.currentStoryIndex);

    if (this.currentStoryIndex === 0) {
      this.currentPersonIndex--;
      stories = this.persons.find((person, index) => index === this.currentPersonIndex)?.stories;
      this.currentStoryIndex = Number(stories?.length) - 1;
    } else {
      this.currentStoryIndex = (this.currentStoryIndex - 1) % this.persons.length;
      stories = this.persons.find((person, index) => index === this.currentPersonIndex)?.stories;
    }

    // this.currentStoryIndex--;
    // }
    this.progressWidth = 0;
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, 500); // Match this timeout with the CSS transition duration
  }

  nextPersonStory() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentStoryIndex = 0;
    clearInterval(this.intervalId);
    this.currentPersonIndex = (this.currentPersonIndex + 1) % this.persons.length;
    this.progressWidth = 0;
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, 500); // Match this timeout with the CSS transition duration
  }

  prevPersonStory() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentStoryIndex = 0;
    clearInterval(this.intervalId);
    this.currentPersonIndex = (this.currentPersonIndex - 1 + this.persons.length) % this.persons.length;
    this.progressWidth = 0;
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, 500); // Match this timeout with the CSS transition duration
  }

  getProgressValue(storyIndex: number): number {
    if(this.isHolding) return this.progressWidth;
    if (storyIndex < this.currentStoryIndex) {
      return 100;
    } else if (storyIndex === this.currentStoryIndex) {
      return this.progressWidth;
    } else {
      return 0;
    }
  }

  onHold() {
    this.isHolding = true;
    clearInterval(this.intervalId);
  }

  onRelease() {
    this.isHolding = false;
    this.startStoryProgress();
  }

  disableContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  onEnd() {
    alert('End');
  }
}
