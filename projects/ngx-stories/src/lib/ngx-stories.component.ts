import { AfterViewInit, Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HammerModule } from '@angular/platform-browser';
// import Hammer from "hammerjs";
declare var Hammer: any;
@Component({
  selector: 'ngx-stories',
  standalone: true,
  imports: [RouterOutlet, HammerModule],
  templateUrl: './ngx-stories.component.html',
  styleUrl: './ngx-stories.component.scss',
})
export class NgxStoriesComponent implements AfterViewInit  {
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
      hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
      hammer.on('swipeleft', () => this.handleSwipe('left'));
      hammer.on('swiperight', () => this.handleSwipe('right'));
      hammer.on('swipedown', () => this.handleSwipe('down'));
      hammer.on('swipeup', () => this.handleSwipe('up'));
    });
  }

  handleSwipe(direction: string) {
    if (direction === 'left') {
      this.isSwipingLeft = true;
      setTimeout(() => {
        if (this.currentPersonIndex === this.persons.length - 1) {
          let stories = this.persons.find((person, index) => index === this.currentPersonIndex)?.stories;
          this.currentStoryIndex = Number(stories?.length) - 1;
          if (this.checkEnd()) return;
        }
        this.nextPersonStory();
        this.resetSwipe();
      }, 600); // Match the animation duration
    } else if (direction === 'right') {
      this.isSwipingRight = true;
      setTimeout(() => {
        this.prevPersonStory();
        this.resetSwipe();
      }, 600); // Match the animation duration
    } else if (direction === 'down') {
      clearInterval(this.intervalId);
      this.onExit();
    } else if (direction === 'up') {
      this.onSwipeUpTriggered();
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
    if (this.checkEnd()) return;
    let stories = this.persons.find((person, index) => index === this.currentPersonIndex)?.stories;

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
  
    let stories = this.persons[this.currentPersonIndex]?.stories;
  
    if (this.currentStoryIndex === 0) {
      // Move to the previous person if the current story index is 0
      if (this.currentPersonIndex > 0) {
        this.currentPersonIndex--;
        stories = this.persons[this.currentPersonIndex]?.stories;
        this.currentStoryIndex = stories?.length ? stories.length - 1 : 0;
      }
    } else {
      // Otherwise, just move to the previous story within the same person
      this.currentStoryIndex--;
    }
  
    this.progressWidth = 0;
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, 500); // Match this timeout with the CSS transition duration
  }
  

  nextPersonStory() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentPersonIndex = (this.currentPersonIndex + 1) % this.persons.length;
    if (this.checkEnd()) return;
    this.currentStoryIndex = 0;
    clearInterval(this.intervalId);
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
    if (this.currentPersonIndex !== 0 && this.persons.length > this.currentPersonIndex) {
      this.currentPersonIndex--;
    }
    this.progressWidth = 0;
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, 500); // Match this timeout with the CSS transition duration
  }

  checkEnd(): boolean {
    let stories = this.persons.find((person, index) => index === this.currentPersonIndex)?.stories;
    if (this.currentStoryIndex === Number(stories?.length) - 1 && this.currentPersonIndex === this.persons.length - 1) {
      this.onEnd();
      return true;
    }
    return false;
  }

  getProgressValue(storyIndex: number): number {
    if (this.isHolding) return this.progressWidth;
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

  onExit() {
    alert('Exit');
  }

  onSwipeUpTriggered() {
    alert('Swipe Up Triggered');
  }
}
