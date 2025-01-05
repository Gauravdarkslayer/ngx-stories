import { AfterViewInit, Component, ElementRef, Input, Output, QueryList, ViewChildren, HostListener, ViewChild, ViewContainerRef, Type } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HammerModule } from '@angular/platform-browser';
import { StoryGroup, StoryStateType } from '../lib/interfaces/interfaces';
import { CommonModule } from '@angular/common';
import { NgxStoriesService } from './ngx-stories.service';
import { NgxStoriesOptions } from '../lib/interfaces/interfaces';
import { onStoryGroupChange, triggerOnEnd, triggerOnExit, triggerOnStoryChange, triggerOnSwipeUp } from './utils/story-event-emitters';
import "hammerjs";
import { options as ngxStoriesOptions } from './utils/default-options';

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
  @Input() options: NgxStoriesOptions = {};

  // Output events to handle end of stories, exit, and swipe-up gesture
  @Output() triggerOnEnd = triggerOnEnd;
  @Output() triggerOnExit = triggerOnExit;
  @Output() triggerOnSwipeUp = triggerOnSwipeUp;
  @Output() onStoryGroupChange = onStoryGroupChange;
  @Output() triggerOnStoryChange = triggerOnStoryChange;

  currentStoryIndex: number = 0;
  currentStoryGroupIndex: number = 0;
  progressWidth: number = 0;
  intervalId: any; // Interval for story progress
  isTransitioning = false; // Prevents multiple transitions at once
  isSwipingLeft = false;
  isSwipingRight = false;
  isHolding = false;
  holdTimeout: any; // Timeout for holding the story (pause functionality)
  storyState: StoryStateType = 'playing';
  isLoading: boolean = false;
  currentProgressWidth: number = 0;
  isAudioEnabled: boolean = false;
  userInteracted: boolean = false;
  // constants
  readonly HOLD_DELAY_MS = 500;
  readonly PROGRESS_INTERVAL_MS = 50;
  readonly FULL_PROGRESS_WIDTH = 100;

  // Queries the story containers in the view for gesture handling
  @ViewChildren('storyContainer') storyContainers!: QueryList<ElementRef>;
  // Add a ViewContainerRef to inject dynamic components
  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef, static: false }) dynamicComponentContainer!: ViewContainerRef;

  constructor(
    private storyService: NgxStoriesService,
  ) {


  }


  //Use Keyboard Navigations to control the stories
  @HostListener('document:keydown', ['$event'])
  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.navigateStory('next'); // Move to the next story
    } else if (event.key === 'ArrowLeft') {
      this.navigateStory('previous'); // Move to the previous story
    } else if (event.key === ' ') {
      event.preventDefault();
      this.togglePause();
    } else if (event.key === 'Escape') {
      this.onExit();
    }
  }

  ngOnInit(): void {
    this.setStoryOptions();
    this.startStoryProgress();
    this.storyGroups = this.storyService.assignIdsIfMissing(this.storyGroups);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  ngAfterViewInit(): void {
    this.initHammer();
  }

  startStoryProgress() {
    this.onContentBuffering(); // Set loading to true initially
    const currentStory = this.storyGroups[this.currentStoryGroupIndex].stories[this.currentStoryIndex];
    let storyDuration = 5000; // Default duration (in milliseconds) for images
    if (currentStory.type === 'video') {
      const videoElement: HTMLVideoElement = document.createElement('video');
      videoElement.src = currentStory.content as string;

      // Use the video duration or a default if not available
      videoElement.onloadedmetadata = () => {
        this.onContentLoaded(); // Call when metadata is loaded
        storyDuration = videoElement.duration * 1000; // Convert to milliseconds
        this.startProgressInterval(storyDuration);
      };
    } else if (currentStory.type === 'component') {
      setTimeout(() => {
        // Small delay to detect changes in DOM
        this.storyService.renderComponent(this.dynamicComponentContainer, currentStory.content as Type<any>);
        this.onContentLoaded();
        this.startProgressInterval(5000); // Default duration for components
      }, 100);
    } else {
      // Handling for images
      const imageElement = document.createElement('img');
      imageElement.src = currentStory.content as string;

      // Check if the image is cached
      if (this.storyService.isImageCached(currentStory.content as string)) {
        this.onContentLoaded(); // Call immediately if cached
        this.startProgressInterval(storyDuration); // Use default image duration
      } else {
        imageElement.onload = () => {
          this.onContentLoaded(); // Call on image load event
          this.startProgressInterval(storyDuration); // Use default image duration
        };
      }

    }
    this.populateCurrentDetails(this.currentStoryIndex, this.currentStoryGroupIndex)
  }

  private setStoryOptions() {
    this.options = {
      ...ngxStoriesOptions,
      ...this.options
    };

    // Set the index for the story view to start with.
    this.currentStoryIndex = this.options.currentStoryIndex as number;
    this.currentStoryGroupIndex = this.options.currentStoryGroupIndex as number;
  }

  startProgressInterval(storyDuration: number) {
    const progressPerTick = this.FULL_PROGRESS_WIDTH / (storyDuration / this.PROGRESS_INTERVAL_MS);

    clearInterval(this.intervalId);

    this.intervalId = this.storyService.startProgress(this.PROGRESS_INTERVAL_MS, () => {
      if (!this.isLoading) {
        // Don't increase the progress width if the story is loading
        this.progressWidth += progressPerTick;
      }
      if (this.progressWidth >= this.FULL_PROGRESS_WIDTH) {
        clearInterval(this.intervalId);
        this.navigateStory('next');
      }
    });
  }

  private initHammer() {
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

  private handleSwipe(direction: string) {
    if (direction === 'left') {
      this.isSwipingLeft = true;
      setTimeout(() => {
        if (this.currentStoryGroupIndex === this.storyGroups.length - 1) {
          let stories = this.storyGroups.find((storyGroup, index) => index === this.currentStoryGroupIndex)?.stories;
          this.currentStoryIndex = Number(stories?.length) - 1;
          if (this.hasReachedEndOfStories()) return;
        }
        this.goToNextStoryGroup();
        this.resetSwipe();
      }, 600); // Match the animation duration
    } else if (direction === 'right') {
      this.isSwipingRight = true;
      setTimeout(() => {
        this.goToPreviousStoryGroup();
        this.resetSwipe();
      }, 600); // Match the animation duration
    } else if (direction === 'down') {
      clearInterval(this.intervalId);
      this.onExit();
    } else if (direction === 'up') {
      this.onSwipeUpTriggered();
    }
  }

  private resetSwipe() {
    this.isSwipingLeft = false;
    this.isSwipingRight = false;
  }

  navigateStory(direction: 'next' | 'previous') {
    if (this.isTransitioning) return;
    this.pauseCurrentVideo(true);  // Pause the video before navigating
    this.setTransitionState(true);
    clearInterval(this.intervalId);

    const { storyGroupIndex, storyIndex } =
      direction === 'next'
        ? this.storyService.nextStory(this.storyGroups, this.currentStoryGroupIndex, this.currentStoryIndex, this.storyGroupChange.bind(this))
        : this.storyService.prevStory(this.storyGroups, this.currentStoryGroupIndex, this.currentStoryIndex, this.storyGroupChange.bind(this));

    this.currentStoryGroupIndex = storyGroupIndex;
    this.currentStoryIndex = storyIndex;

    //Trigger onEnd emitter when all the storieGroups are traversed.
    if (this.currentStoryGroupIndex === this.storyGroups.length) {
      this.onEnd();
      return;
    }

    this.progressWidth = 0;
    this.setTransitionState(false, this.HOLD_DELAY_MS);

    if (this.storyState !== 'paused') {
      this.storyState = 'playing';
      this.startStoryProgress();
      this.playCurrentStoryVideo();
    }
  }

  private playCurrentStoryVideo() {
    setTimeout(() => {
      const currentStory = this.storyGroups.find((storyGroup, index) => index === this.currentStoryGroupIndex)?.stories[this.currentStoryIndex];

      // If the current story is a video, find the video element and play it
      if (currentStory?.type === 'video') {
        const activeStoryContainer = this.storyContainers.toArray()[this.currentStoryGroupIndex]; // Current story group container
        const activeStoryContent = activeStoryContainer.nativeElement.querySelector('.story-content.active'); // Active story within the group
        const videoElement: HTMLVideoElement | null = activeStoryContent.querySelector('video');

        if (videoElement) {
          videoElement.muted = !this.isAudioEnabled;
          videoElement.play().catch(err => {
            console.error(err);
          })
        }
      }
    }, 0);

  }

  private pauseCurrentVideo(seek: null | boolean = null) {
    let currentStory = this.storyGroups.find((storyGroup, index) => index === this.currentStoryGroupIndex)?.stories[this.currentStoryIndex];
    if (currentStory?.type === 'video') {
      const activeStoryContainer = this.storyContainers.toArray()[this.currentStoryGroupIndex]; // Current story group container
      const activeStoryContent = activeStoryContainer.nativeElement.querySelector('.story-content.active'); // Active story within the group
      const videoElement: HTMLVideoElement | null = activeStoryContent.querySelector('video');

      if (videoElement) {
        videoElement.pause();
        seek && (videoElement.currentTime = 0);
      }
    }
  }

  private goToNextStoryGroup() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentStoryGroupIndex = (this.currentStoryGroupIndex + 1) % this.storyGroups.length;
    if (this.hasReachedEndOfStories()) return;
    this.currentStoryIndex = 0;
    clearInterval(this.intervalId);
    this.progressWidth = 0;
    this.storyGroupChange();
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, this.HOLD_DELAY_MS); // Match this timeout with the CSS transition duration
  }

  private goToPreviousStoryGroup() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentStoryIndex = 0;
    clearInterval(this.intervalId);
    if (this.currentStoryGroupIndex !== 0 && this.storyGroups.length > this.currentStoryGroupIndex) {
      this.currentStoryGroupIndex--;
    }
    this.progressWidth = 0;
    this.storyGroupChange();
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, this.HOLD_DELAY_MS); // Match this timeout with the CSS transition duration
  }

  private setTransitionState(isTransitioning: boolean, duration = this.HOLD_DELAY_MS): void {
    this.isTransitioning = isTransitioning;
    setTimeout(() => {
      this.isTransitioning = false;
    }, duration); // Ensure consistent transition timing
  }

  private hasReachedEndOfStories(): boolean {
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
      return this.FULL_PROGRESS_WIDTH;
    } else if (storyIndex === this.currentStoryIndex) {
      return this.progressWidth;
    } else {
      return 0;
    }
  }

  onTouchStart() {
    this.holdTimeout = setTimeout(() => {
      this.onHold();
    }, this.HOLD_DELAY_MS);
  }

  onHold() {
    this.isHolding = true;
    this.storyState = 'paused';
    this.pauseCurrentVideo();  // Pause the video when holding
    clearInterval(this.intervalId);
  }

  onRelease() {
    clearTimeout(this.holdTimeout);  // Cancel hold if user releases before 1 second
    if (this.isHolding) {
      this.isHolding = false;
      this.storyState = 'playing';
      this.startStoryProgress();
      this.playCurrentStoryVideo();  // Resume the video when released
    }
  }

  disableContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  togglePause() {
    this.storyState = this.storyState === 'paused' ? 'playing' : 'paused';
    if (this.storyState === 'paused') {
      clearInterval(this.intervalId);
      this.pauseCurrentVideo();
    } else {
      this.startStoryProgress();
      this.playCurrentStoryVideo();  // Resume the video when released
    }
  }

  private onEnd() {
    this.triggerOnEnd.emit();
  }

  private onExit() {
    // Swipe down event or cross button implementation in future
    this.triggerOnExit.emit();
  }

  private onSwipeUpTriggered() {
    this.triggerOnSwipeUp.emit();
  }

  private storyGroupChange(storyGroupIndex: number = this.currentStoryGroupIndex) {
    this.onStoryGroupChange.emit(storyGroupIndex);
  }

  private populateCurrentDetails(currentSIndex: number, currentSGIndex: number) {
    try {
      const dataToSend = {
        currentPerson: this.storyGroups[currentSGIndex].name,
        currentPersonIndex: currentSGIndex,
        currentStory: this.storyGroups[currentSGIndex].stories[currentSIndex],
        currentStoryIndex: currentSIndex,
        previousStory: currentSIndex !== 0 ? this.storyGroups[currentSGIndex].stories[currentSIndex - 1] : null,
        previousStoryIndex: currentSIndex !== 0 ? currentSIndex : null
      }
      this.triggerOnStoryChange.emit(dataToSend);
    } catch (error) {
      console.error(error);
    }
  }

  // When content (image or video) has loaded
  onContentLoaded() {
    this.isLoading = false;
  }

  // When content is buffering/loading
  onContentBuffering() {
    this.isLoading = true;
  }

  // If there's an error loading content
  onContentError() {
    console.error('Error loading content');
    this.isLoading = false;
  }

  toggleAudio() {
    this.isAudioEnabled = !this.isAudioEnabled;
    this.storyContainers.first.nativeElement.querySelector('video').muted = !this.isAudioEnabled;
  }

  // Detect user interaction on the document level
  @HostListener('document:click', ['$event'])
  onUserInteraction() {
    if (!this.userInteracted) {
      this.userInteracted = true;
      this.isAudioEnabled = true;
    }
  }

}
