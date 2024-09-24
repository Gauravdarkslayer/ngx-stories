import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HammerModule } from '@angular/platform-browser';
import { StoryGroup } from '../lib/interfaces/interfaces';
import "hammerjs";
import { CommonModule } from '@angular/common';
import { NgxStoriesService } from './ngx-stories.service';
import { NgxStoriesOptions } from '../lib/interfaces/interfaces';

@Component({
  selector: 'ngx-stories',
  standalone: true,
  imports: [RouterOutlet, HammerModule, CommonModule],
  templateUrl: './ngx-stories.component.html',
  styleUrl: './ngx-stories.component.scss',
})
export class NgxStoriesComponent implements AfterViewInit {
  title = 'ngx-stories';
  
  // Input property to accept the list of storyGroup and their stories
  @Input({ required: true }) storyGroups: StoryGroup[] = [];
  
  // options
  @Input() options: NgxStoriesOptions = {
    width: 360,
    height: 768,
  };
  // Output events to handle end of stories, exit, and swipe-up gesture
  @Output() triggerOnEnd = new EventEmitter<void>();
  @Output() triggerOnExit = new EventEmitter<void>();
  @Output() triggerOnSwipeUp = new EventEmitter<void>();

  currentStoryIndex: number = 0;
  currentStoryGroupIndex: number = 0;
  progressWidth: number = 0;
  intervalId: any; // Interval for story progress
  isTransitioning = false; // Prevents multiple transitions at once
  isSwipingLeft = false;
  isSwipingRight = false;
  isHolding = false;
  holdTimeout: any; // Timeout for holding the story (pause functionality)
  isPaused: boolean = false;

  // Queries the story containers in the view for gesture handling
  @ViewChildren('storyContainer') storyContainers!: QueryList<ElementRef>;

  constructor(
    private storyService: NgxStoriesService
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
    this.intervalId && this.storyService.clearProgress(this.intervalId);
    this.intervalId = this.storyService.startProgress(50, () => {
      this.progressWidth += 1;
      if (this.progressWidth >= 100) {
        this.nextStory();
      }
    });
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
    this.storyService.setOptions(this.options, this.storyContainers);
  }

  handleSwipe(direction: string) {
    if (direction === 'left') {
      this.isSwipingLeft = true;
      setTimeout(() => {
        if (this.currentStoryGroupIndex === this.storyGroups.length - 1) {
          let stories = this.storyGroups.find((storyGroup, index) => index === this.currentStoryGroupIndex)?.stories;
          this.currentStoryIndex = Number(stories?.length) - 1;
          if (this.checkEnd()) return;
        }
        this.nextStoryGroup();
        this.resetSwipe();
      }, 600); // Match the animation duration
    } else if (direction === 'right') {
      this.isSwipingRight = true;
      setTimeout(() => {
        this.prevStoryGroup();
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
    if (this.checkEnd()) { 
      this.isTransitioning = false; 
      return;
    }

    // Using the service to determine the next story
    const { storyGroupIndex, storyIndex } = this.storyService.nextStory(this.storyGroups, this.currentStoryGroupIndex, this.currentStoryIndex);
    this.currentStoryGroupIndex = storyGroupIndex;
    this.currentStoryIndex = storyIndex;

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

    // Using the service to determine the previous story
    const { storyGroupIndex, storyIndex } = this.storyService.prevStory(this.storyGroups, this.currentStoryGroupIndex, this.currentStoryIndex);
    this.currentStoryGroupIndex = storyGroupIndex;
    this.currentStoryIndex = storyIndex;

    this.progressWidth = 0;
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, 500); // Match this timeout with the CSS transition duration
  }


  nextStoryGroup() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentStoryGroupIndex = (this.currentStoryGroupIndex + 1) % this.storyGroups.length;
    if (this.checkEnd()) return;
    this.currentStoryIndex = 0;
    clearInterval(this.intervalId);
    this.progressWidth = 0;
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, 500); // Match this timeout with the CSS transition duration
  }

  prevStoryGroup() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentStoryIndex = 0;
    clearInterval(this.intervalId);
    if (this.currentStoryGroupIndex !== 0 && this.storyGroups.length > this.currentStoryGroupIndex) {
      this.currentStoryGroupIndex--;
    }
    this.progressWidth = 0;
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, 500); // Match this timeout with the CSS transition duration
  }

  checkEnd(): boolean {
    let stories = this.storyGroups.find((storyGroup, index) => index === this.currentStoryGroupIndex)?.stories;
    if (this.currentStoryIndex === Number(stories?.length) - 1 && this.currentStoryGroupIndex === this.storyGroups.length - 1) {
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

  onTouchStart() {
    this.holdTimeout = setTimeout(() => {
      this.onHold();
    }, 500);  // 500ms delay
  }

  onHold() {
    this.isHolding = true;
    clearInterval(this.intervalId);
  }

  onRelease() {
    this.isHolding = false;
    clearTimeout(this.holdTimeout);  // Cancel hold if user releases before 1 second
    this.startStoryProgress();
  }

  disableContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  togglePause() {
    if (this.isPaused) {
      this.isPaused = false;
      this.startStoryProgress();
    } else {
      this.isPaused = true;
      clearInterval(this.intervalId);
    }
  }

  onEnd() {
    this.triggerOnEnd.emit();
  }

  onExit() {
    // Swipe down event
    this.triggerOnExit.emit();
  }

  onSwipeUpTriggered() {
    this.triggerOnSwipeUp.emit();
  }
}
