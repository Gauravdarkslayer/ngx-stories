import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren, ViewContainerRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HammerModule } from '@angular/platform-browser';
import { Person } from '../lib/interfaces/interfaces';
import "hammerjs";
import { CommonModule } from '@angular/common';
import { NgxStoriesService } from './ngx-stories.service';

@Component({
  selector: 'ngx-stories',
  standalone: true,
  imports: [RouterOutlet, HammerModule, CommonModule],
  templateUrl: './ngx-stories.component.html',
  styleUrls: ['./ngx-stories.component.scss'],
})
export class NgxStoriesComponent implements AfterViewInit, OnInit {
  title = 'ngx-stories';

  // Input property to accept the list of persons and their stories
  @Input({ required: true }) persons: Person[] = [];

  // Output events to handle end of stories, exit, and swipe-up gesture
  @Output() triggerOnEnd = new EventEmitter<void>();
  @Output() triggerOnExit = new EventEmitter<void>();
  @Output() triggerOnSwipeUp = new EventEmitter<void>();

  currentStoryIndex: number = 0;
  currentPersonIndex: number = 0;
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
    private storyService: NgxStoriesService,
    private viewContainerRef: ViewContainerRef // Inject ViewContainerRef
  ) { }

  ngOnInit(): void {
    this.startStoryProgress();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  ngAfterViewInit(): void {
    this.initHammer();
    this.loadCurrentStory(); // Load the initial story after view init
  }

  loadCurrentStory() {
    const currentStory = this.persons[this.currentPersonIndex].stories[this.currentStoryIndex];
    const storyContainer = this.storyContainers.toArray()[this.currentPersonIndex];

    // Clear any previously rendered content
    storyContainer.nativeElement.innerHTML = '';

    // Load the current story component or content dynamically
    if (currentStory.component) {
      const componentRef = this.viewContainerRef.createComponent(currentStory.component);
      storyContainer.nativeElement.appendChild(componentRef.location.nativeElement);
    } else if (currentStory.content) {
      const textNode = document.createTextNode(currentStory.content);
      storyContainer.nativeElement.appendChild(textNode);
    } else if (currentStory.imageUrl) {
      const imgElement = document.createElement('img');
      imgElement.src = currentStory.imageUrl;
      imgElement.style.width = '100%';
      imgElement.style.height = '100%';
      storyContainer.nativeElement.appendChild(imgElement);
    } else if (currentStory.videoUrl) {
      const videoElement = document.createElement('video');
      videoElement.src = currentStory.videoUrl;
      videoElement.controls = true;
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      storyContainer.nativeElement.appendChild(videoElement);
    }
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
  }

  handleSwipe(direction: string) {
    if (direction === 'left') {
      this.isSwipingLeft = true;
      setTimeout(() => {
        if (this.currentPersonIndex === this.persons.length - 1) {
          let stories = this.persons[this.currentPersonIndex]?.stories;
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
    if (this.checkEnd()) { 
      this.isTransitioning = false; 
      return;
    }

    // Using the service to determine the next story
    const { personIndex, storyIndex } = this.storyService.nextStory(this.persons, this.currentPersonIndex, this.currentStoryIndex);
    this.currentPersonIndex = personIndex;
    this.currentStoryIndex = storyIndex;

    this.progressWidth = 0;
    setTimeout(() => {
      this.loadCurrentStory(); // Load the new current story
      this.startStoryProgress();
      this.isTransitioning = false;
    }, 500); // Match this timeout with the CSS transition duration
  }

  prevStory() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    clearInterval(this.intervalId);

    // Using the service to determine the previous story
    const { personIndex, storyIndex } = this.storyService.prevStory(this.persons, this.currentPersonIndex, this.currentStoryIndex);
    this.currentPersonIndex = personIndex;
    this.currentStoryIndex = storyIndex;

    this.progressWidth = 0;
    setTimeout(() => {
      this.loadCurrentStory(); // Load the new current story
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
      this.loadCurrentStory(); // Load the new current story
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
      this.loadCurrentStory(); // Load the new current story
      this.startStoryProgress();
      this.isTransitioning = false;
    }, 500); // Match this timeout with the CSS transition duration
  }

  checkEnd(): boolean {
    let stories = this.persons[this.currentPersonIndex]?.stories;
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
      this.startStoryProgress();
    } else {
      clearInterval(this.intervalId);
    }
    this.isPaused = !this.isPaused;
  }

  onSwipeUpTriggered() {
    this.triggerOnSwipeUp.emit();
  }

  onEnd() {
    this.triggerOnEnd.emit();
  }

  onExit() {
    this.triggerOnExit.emit();
  }
}
