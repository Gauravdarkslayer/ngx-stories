import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  Type,
  ViewChild,
  ViewChildren,
  ViewContainerRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoryUtilityService } from './services/story-utility.service';
import { StoryStateService } from './services/story-state.service';
import { StoryVideoService } from './services/story-video.service';
import { StoryGroup, StoryStateType, NgxStoriesOptions, StoryChangeEventData } from './interfaces/interfaces';
import { DEFAULT_STORIES_OPTIONS } from './utils/default-options';

@Component({
  selector: 'ngx-stories',
  standalone: true,
  imports: [CommonModule],
  providers: [StoryUtilityService, StoryStateService, StoryVideoService],
  templateUrl: './ngx-stories.component.html',
  styleUrl: './ngx-stories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxStoriesComponent implements OnInit, AfterViewInit, OnDestroy {
  title = 'ngx-stories';

  // Input property to accept the list of storyGroup and their stories
  @Input({ required: true }) storyGroups: StoryGroup[] = [];

  /** Emitted when all stories in all groups have been viewed. */
  @Output() readonly triggerOnEnd = new EventEmitter<void>();

  /** Emitted when the user exits the stories (swipe down or Escape key). */
  @Output() readonly triggerOnExit = new EventEmitter<void>();

  /** Emitted when the user swipes up on a story. */
  @Output() readonly triggerOnSwipeUp = new EventEmitter<void>();

  /** Emitted when the active story group changes. Payload is the new group index. */
  @Output() readonly onStoryGroupChange = new EventEmitter<number>();

  /** Emitted when the active story changes within a group. */
  @Output() readonly triggerOnStoryChange = new EventEmitter<StoryChangeEventData>();

  progressWidth = 0;
  isTransitioning = false;
  isSwipingLeft = false;
  isSwipingRight = false;
  isHolding = false;
  isLoading = false;
  isContentError = false;

  /** Reference to the interval for story progress. */
  private intervalId: ReturnType<typeof setInterval> | null = null;
  /** Reference to the timeout for long-press (hold) detection. */
  private holdTimeout: ReturnType<typeof setTimeout> | null = null;
  /** Reference to the timeout for automatically skipping a story after an error. */
  private errorTimeout: ReturnType<typeof setTimeout> | null = null;
  /** Reference to the timeout for swipe animations. */
  private swipeTimeout: ReturnType<typeof setTimeout> | null = null;
  /** Set of all tracked timeouts for transitions and animations. */
  private transitionTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

  get currentStoryIndex() { return this.stateService.currentStoryIndex; }
  set currentStoryIndex(val: number) { this.stateService.currentStoryIndex = val; }
  get currentStoryGroupIndex() { return this.stateService.currentStoryGroupIndex; }
  set currentStoryGroupIndex(val: number) { this.stateService.currentStoryGroupIndex = val; }
  get storyState() { return this.stateService.storyState; }
  set storyState(val: StoryStateType) { this.stateService.storyState = val; }
  get isAudioEnabled() { return this.videoService.isAudioEnabled; }
  set isAudioEnabled(val: boolean) { this.videoService.isAudioEnabled = val; }

  @Input()
  get options(): NgxStoriesOptions { return this.stateService.options; }
  set options(val: NgxStoriesOptions) { this.stateService.options = val; }
  // constants
  readonly HOLD_DELAY_MS = 500;
  readonly PROGRESS_INTERVAL_MS = 50;
  readonly FULL_PROGRESS_WIDTH = 100;
  readonly DEFAULT_STORY_DURATION = 5000;

  // Queries the story containers in the view for gesture handling
  @ViewChildren('storyContainer') storyContainers!: QueryList<ElementRef>;
  // Add a ViewContainerRef to inject dynamic components
  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef, static: false }) dynamicComponentContainer!: ViewContainerRef;

  private touchStartX = 0;
  private touchStartY = 0;
  private initTimeout: ReturnType<typeof setTimeout> | undefined;

  private videoFrameId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  // Store current and target colors for interpolation
  private currentColors: number[][] = [[0, 0, 0], [0, 0, 0]];
  private targetColors: number[][] = [[0, 0, 0], [0, 0, 0]];

  currentStoryBackground: string = 'black';
  constructor(
    private storyUtilityService: StoryUtilityService,
    private stateService: StoryStateService,
    private videoService: StoryVideoService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  /** Safely clears the progress interval and resets to null. */
  private clearProgressInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Safely clears the hold timeout and resets to null. */
  private clearHoldTimeout(): void {
    if (this.holdTimeout !== null) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }
  }

  /** Safely clears the error timeout and resets to null. */
  private clearErrorTimeout(): void {
    if (this.errorTimeout !== null) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
  }

  /**
   * Creates a tracked timeout that will be automatically cleaned up on component destroy.
   * @param callback The function to execute after the delay.
   * @param delay The delay in milliseconds.
   * @returns The timeout ID.
   */
  private createTrackedTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    const timeoutId = setTimeout(() => {
      this.transitionTimeouts.delete(timeoutId);
      callback();
    }, delay);
    this.transitionTimeouts.add(timeoutId);
    return timeoutId;
  }

  //Use Keyboard Navigations to control the stories
  /**
   * Handles keyboard events for story navigation and control.
   * @param event The keyboard event.
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.navigateStory('next');
    } else if (event.key === 'ArrowLeft') {
      this.navigateStory('previous');
    } else if (event.key === ' ') {
      event.preventDefault(); // Prevent page scrolling
      this.togglePause();
    } else if (event.key === 'Escape') {
      this.onExit();
    }
  }

  ngOnInit(): void {
    this.validateInputs();
    this.stateService.initialize(this.storyGroups, this.options);
  }

  ngOnDestroy(): void {
    // Clear all intervals and timeouts to prevent memory leaks
    this.clearProgressInterval();
    if (this.initTimeout !== undefined) {
      clearTimeout(this.initTimeout);
    }
    if (this.holdTimeout !== null) {
      this.clearHoldTimeout();
    }
    this.clearErrorTimeout();

    // Clear swipe timeout
    if (this.swipeTimeout !== null) {
      clearTimeout(this.swipeTimeout);
      this.swipeTimeout = null;
    }

    // Clear all tracked transition timeouts
    this.transitionTimeouts.forEach(timeout => clearTimeout(timeout));
    this.transitionTimeouts.clear();

    this.stopVideoBackgroundUpdate();
  }

  ngAfterViewInit(): void {
    this.storyUtilityService.setOptions(this.options, this.storyContainers);
    // Delay startStoryProgress to avoid ExpressionChangedAfterItHasBeenCheckedError
    // and ensure ViewChildren are fully initialized for the first story.
    this.initTimeout = setTimeout(() => {
      this.startStoryProgress();
    }, 0);
  }

  startStoryProgress() {
    this.isContentError = false;
    this.onContentBuffering(); // Set loading to true initially

    // Validate story group and story exist before accessing
    const storyGroup = this.storyGroups[this.currentStoryGroupIndex];
    if (!storyGroup || !storyGroup.stories) {
      console.error('ngx-stories: Invalid story group index in startStoryProgress', this.currentStoryGroupIndex);
      this.onContentError();
      return;
    }

    const currentStory = storyGroup.stories[this.currentStoryIndex];
    if (!currentStory) {
      console.error('ngx-stories: Invalid story index in startStoryProgress', this.currentStoryIndex);
      this.onContentError();
      return;
    }

    if (currentStory.type === 'video') {
      // Video loading is handled by the template events (loadeddata, playing)
      // which call onContentLoaded()
    } else if (currentStory.type === 'component') {
      // Force change detection to ensure dynamicComponentContainer is updated in the view
      // based on the current index before we try to access it.
      this.cdr.detectChanges();
      if (this.dynamicComponentContainer) {
        this.storyUtilityService.renderComponent(this.dynamicComponentContainer, currentStory.content as Type<any>);
        this.onContentLoaded();
      } else {
        console.error('dynamicComponentContainer not available for component rendering. Cannot render component story.');
        this.onContentError();
      }
    } else {
      // Handling for images
      const imageElement = document.createElement('img');
      imageElement.crossOrigin = currentStory.crossOrigin === undefined ? 'anonymous' : (currentStory.crossOrigin || null);
      imageElement.src = currentStory.content as string;

      // Check if the image is cached
      if (this.storyUtilityService.isImageCached(currentStory.content as string)) {
        this.onContentLoaded(); // Call immediately if cached
      } else {
        imageElement.onload = () => {
          this.onContentLoaded(); // Call on image load event
        };
        // Add error handling for preloading images to prevent hanging
        imageElement.onerror = () => {
          this.onContentError();
        };
      }

    }
    this.populateCurrentDetails(this.currentStoryIndex, this.currentStoryGroupIndex)
  }

  /**
   * Validates required inputs and throws meaningful errors for invalid configuration.
   */
  private validateInputs(): void {
    if (!this.storyGroups || this.storyGroups.length === 0) {
      throw new Error('ngx-stories: storyGroups input is required and must contain at least one group.');
    }

    for (const group of this.storyGroups) {
      if (!group.stories || group.stories.length === 0) {
        throw new Error(`ngx-stories: Story group "${group.name}" must contain at least one story.`);
      }

      for (const story of group.stories) {
        if (story.type === 'component' && typeof story.content === 'string') {
          throw new Error(
            `ngx-stories: Story with type "component" must have a component class as content, not a string.`
          );
        }
        if ((story.type === 'image' || story.type === 'video') && typeof story.content !== 'string') {
          throw new Error(
            `ngx-stories: Story with type "${story.type}" must have a URL string as content.`
          );
        }
      }
    }
  }

  startProgressInterval(storyDuration: number) {
    const progressPerTick = this.FULL_PROGRESS_WIDTH / (storyDuration / this.PROGRESS_INTERVAL_MS);

    this.clearProgressInterval();

    this.ngZone.runOutsideAngular(() => {
      this.intervalId = this.storyUtilityService.startProgress(this.PROGRESS_INTERVAL_MS, () => {
        if (!this.isLoading) {
          // Don't increase the progress width if the story is loading
          this.progressWidth += progressPerTick;
          // With OnPush strategy, we need explicit detectChanges even inside ngZone.run
          this.ngZone.run(() => {
            this.cdr.detectChanges();
          });
        }
        if (this.progressWidth >= this.FULL_PROGRESS_WIDTH) {
          this.clearProgressInterval();
          this.ngZone.run(() => {
            this.navigateStory('next');
          });
        }
      });
    });
  }

  private detectSwipe(startX: number, startY: number, endX: number, endY: number) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Minimum distance for a swipe to be recognized
    const threshold = 50;

    if (Math.max(absX, absY) > threshold) {
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.handleSwipe('right');
        } else {
          this.handleSwipe('left');
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.handleSwipe('down');
        } else {
          this.handleSwipe('up');
        }
      }
    }
  }


  private handleSwipe(direction: string) {
    if (direction === 'left') {
      this.isSwipingLeft = true;
      this.cdr.detectChanges();
      if (this.swipeTimeout !== null) {
        clearTimeout(this.swipeTimeout);
      }
      this.swipeTimeout = setTimeout(() => {
        if (this.currentStoryGroupIndex === this.storyGroups.length - 1) {
          let stories = this.storyGroups[this.currentStoryGroupIndex].stories;
          this.currentStoryIndex = stories.length - 1;
          if (this.hasReachedEndOfStories()) return;
        }
        this.goToNextStoryGroup();
        this.resetSwipe();
        this.swipeTimeout = null;
      }, 600); // Match the animation duration
    } else if (direction === 'right') {
      this.isSwipingRight = true;
      this.cdr.detectChanges();
      this.swipeTimeout = setTimeout(() => {
        this.goToPreviousStoryGroup();
        this.resetSwipe();
        this.swipeTimeout = null;
      }, 600); // Match the animation duration
    } else if (direction === 'down') {
      this.clearProgressInterval();
      this.onExit();
    } else if (direction === 'up') {
      this.onSwipeUpTriggered();
    }
  }

  private resetSwipe() {
    this.isSwipingLeft = false;
    this.isSwipingRight = false;
    this.cdr.detectChanges();
  }

  navigateStory(direction: 'next' | 'previous') {
    if (this.isTransitioning) return;
    this.pauseCurrentVideo(true);  // Pause the video before navigating
    this.setTransitionState(true);
    this.clearProgressInterval();
    this.clearErrorTimeout();

    const { storyGroupIndex, storyIndex } = this.stateService.navigate(direction, this.storyGroupChange.bind(this));

    this.currentStoryGroupIndex = storyGroupIndex;
    this.currentStoryIndex = storyIndex;
    this.resetBackground();

    //Trigger onEnd emitter when all the storieGroups are traversed.
    if (this.currentStoryGroupIndex === this.storyGroups.length) {
      this.onEnd();
      return;
    }

    this.progressWidth = 0;
    this.setTransitionState(false, this.HOLD_DELAY_MS);

    // Always initialize story content (render components, prepare images)
    // regardless of play/pause state to prevent black screens.
    this.startStoryProgress();

    if (this.storyState !== 'paused') {
      this.storyState = 'playing';
      // startStoryProgress will be called and cdr.detectChanges() will be triggered there
      // but we need to update view for empty ProgressWidth and new story index immediately
      this.cdr.detectChanges();
      this.playCurrentStoryVideo();
    } else {
      this.cdr.detectChanges();
    }
  }

  private playCurrentStoryVideo() {
    this.createTrackedTimeout(() => {
      const currentStory = this.stateService.getCurrentStory();

      if (currentStory?.type === 'video') {
        const videoElement = this.videoService.getActiveVideoElement(this.storyContainers, this.currentStoryGroupIndex);
        this.videoService.playVideoWithRetry(
          videoElement,
          () => this.cdr.detectChanges(), // Fallback (muted)
          () => this.onContentError()     // Error
        );
        if (videoElement) {
          this.startVideoBackgroundUpdate(videoElement);
        }
      }
    }, 0);
  }

  private pauseCurrentVideo(seek: null | boolean = null) {
    this.stopVideoBackgroundUpdate();
    this.videoService.pauseAllVideos(this.storyContainers, !!seek);
    // No need for detectChanges here - no view state changes that require immediate update
  }

  private resetBackground() {
    const defaultColor = this.options.backlitColor || '#1b1b1b';
    this.currentStoryBackground = defaultColor;
    const parsedRef = this.storyUtilityService.parseColor(defaultColor);
    this.currentColors = [[...parsedRef], [...parsedRef]];
    this.targetColors = [[...parsedRef], [...parsedRef]];
    // Caller will handle change detection
  }

  private goToNextStoryGroup() {
    this.pauseCurrentVideo(true);
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentStoryGroupIndex = (this.currentStoryGroupIndex + 1) % this.storyGroups.length;
    if (this.hasReachedEndOfStories()) return;
    this.currentStoryIndex = 0;
    this.resetBackground();
    this.clearProgressInterval();
    this.clearErrorTimeout();
    this.progressWidth = 0;
    this.storyGroupChange();
    this.cdr.detectChanges(); // Update view for transition state
    this.createTrackedTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
      this.cdr.detectChanges();
    }, this.HOLD_DELAY_MS); // Match this timeout with the CSS transition duration
  }

  private goToPreviousStoryGroup() {
    this.pauseCurrentVideo(true); // <-- Add this line
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentStoryIndex = 0;
    this.resetBackground();
    this.clearProgressInterval();
    this.clearErrorTimeout();
    if (this.currentStoryGroupIndex !== 0 && this.storyGroups.length > this.currentStoryGroupIndex) {
      this.currentStoryGroupIndex--;
    }
    this.progressWidth = 0;
    this.storyGroupChange();
    this.cdr.detectChanges(); // Update view
    this.createTrackedTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
      this.cdr.detectChanges();
    }, this.HOLD_DELAY_MS); // Match this timeout with the CSS transition duration
  }

  private setTransitionState(isTransitioning: boolean, duration = this.HOLD_DELAY_MS): void {
    this.isTransitioning = isTransitioning;
    this.cdr.detectChanges();
    this.createTrackedTimeout(() => {
      this.isTransitioning = false;
      this.cdr.detectChanges();
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

  onTouchStart(event: TouchEvent | MouseEvent) {
    if (event instanceof TouchEvent) {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
    } else {
      this.touchStartX = (event as MouseEvent).clientX;
      this.touchStartY = (event as MouseEvent).clientY;
    }
    this.holdTimeout = setTimeout(() => {
      this.onHold();
    }, this.HOLD_DELAY_MS);
  }

  onHold() {
    this.isHolding = true;
    this.storyState = 'paused';
    this.pauseCurrentVideo();  // Pause the video when holding
    this.clearProgressInterval();
    this.cdr.detectChanges();
  }

  onRelease(event: TouchEvent | MouseEvent) {
    this.clearHoldTimeout();  // Cancel hold if user releases before 1 second
    if (this.isHolding) {
      this.isHolding = false;
      this.storyState = 'playing';
      this.startStoryProgress();
      this.playCurrentStoryVideo();  // Resume the video when released
    } else {
      let touchEndX: number;
      let touchEndY: number;

      if (event instanceof TouchEvent) {
        touchEndX = event.changedTouches[0].clientX;
        touchEndY = event.changedTouches[0].clientY;
      } else {
        touchEndX = (event as MouseEvent).clientX;
        touchEndY = (event as MouseEvent).clientY;
      }

      this.detectSwipe(this.touchStartX, this.touchStartY, touchEndX, touchEndY);
    }
    this.cdr.detectChanges();
  }

  disableContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  togglePause() {
    this.storyState = this.storyState === 'paused' ? 'playing' : 'paused';
    if (this.storyState === 'paused') {
      this.clearProgressInterval();
      this.pauseCurrentVideo();
    } else {
      this.startStoryProgress();
      this.playCurrentStoryVideo();  // Resume the video when released
    }
    this.cdr.detectChanges();
  }

  toggleAudio() {
    const videoElement = this.videoService.getActiveVideoElement(this.storyContainers, this.currentStoryGroupIndex);
    this.videoService.toggleAudio(videoElement);
    this.cdr.detectChanges();
  }

  onContentBuffering() {
    this.isLoading = true;
    this.cdr.detectChanges();
  }

  onContentError() {
    this.isLoading = false;
    this.isContentError = true;
    this.cdr.detectChanges();
    // Auto advance after 3 seconds
    this.ngZone.runOutsideAngular(() => {
      this.errorTimeout = setTimeout(() => {
        this.ngZone.run(() => {
          this.navigateStory('next');
        });
      }, 3000);
    });
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

  private populateCurrentDetails(storyIndex: number, storyGroupIndex: number): void {
    try {
      const dataToSend: StoryChangeEventData = {
        currentStoryGroupName: this.storyGroups[storyGroupIndex].name,
        currentStoryGroupIndex: storyGroupIndex,
        currentStory: this.storyGroups[storyGroupIndex].stories[storyIndex],
        currentStoryIndex: storyIndex,
        previousStory: storyIndex !== 0 ? this.storyGroups[storyGroupIndex].stories[storyIndex - 1] : null,
        previousStoryIndex: storyIndex !== 0 ? storyIndex - 1 : null
      };
      this.triggerOnStoryChange.emit(dataToSend);
    } catch (error) {
      console.error('ngx-stories: Failed to emit story change event:', error);
    }
  }

  // When content (image or video) has loaded
  onContentLoaded() {
    this.isLoading = false;
    this.isContentError = false;

    // Validate story group and story exist before accessing
    const storyGroup = this.storyGroups[this.currentStoryGroupIndex];
    if (!storyGroup || !storyGroup.stories) {
      console.error('ngx-stories: Invalid story group index', this.currentStoryGroupIndex);
      this.onContentError();
      return;
    }

    const currentStory = storyGroup.stories[this.currentStoryIndex];
    if (!currentStory) {
      console.error('ngx-stories: Invalid story index', this.currentStoryIndex);
      this.onContentError();
      return;
    }

    if (currentStory.type === 'video') {
      const activeStoryContainer = this.storyContainers.toArray()[this.currentStoryGroupIndex];
      const activeStoryContent = activeStoryContainer?.nativeElement.querySelector('.story-content.active');
      const videoElement: HTMLVideoElement | null = activeStoryContent?.querySelector('video');
      let storyDuration = this.DEFAULT_STORY_DURATION;
      if (videoElement && isFinite(videoElement.duration) && videoElement.duration > 0) {
        storyDuration = videoElement.duration * 1000;
      }
      if (this.storyState === 'playing') {
        this.startProgressInterval(storyDuration);
      }
    } else {
      // For images and components, use the default duration or a configurable one
      if (this.storyState === 'playing') {
        this.startProgressInterval(this.DEFAULT_STORY_DURATION);
      }
    }

    this.createTrackedTimeout(() => {
      // For images, we can update immediately or animate. 
      // Let's just update immediately for now, or let the loop handle it if it's a video.
      this.updateBackground();
      this.cdr.detectChanges();
    }, 0);
    this.cdr.detectChanges();
  }

  updateBackground(existingMediaElement?: HTMLImageElement | HTMLVideoElement) {
    if (!this.storyContainers) return;
    const activeStoryContainer = this.storyContainers.toArray()[this.currentStoryGroupIndex];
    if (!activeStoryContainer) return;

    // Validate story group and story exist before accessing
    const storyGroup = this.storyGroups[this.currentStoryGroupIndex];
    if (!storyGroup || !storyGroup.stories) {
      console.error('ngx-stories: Invalid story group index in updateBackground', this.currentStoryGroupIndex);
      return;
    }

    const currentStory = storyGroup.stories[this.currentStoryIndex];
    if (!currentStory) {
      console.error('ngx-stories: Invalid story index in updateBackground', this.currentStoryIndex);
      return;
    }

    // Check if current story is a component or if gradient background is disabled
    if (currentStory.type === 'component' || !this.options.enableGradientBackground) {
      this.currentStoryBackground = this.options.backlitColor || '#1b1b1b';
      // If called from a loop outside angular, we need to update style explicitly if we want to avoid detectChanges
      // safely update the DOM node if we can find it
      const backgroundEl = activeStoryContainer.nativeElement.querySelector('.story-style');
      if (backgroundEl) {
        backgroundEl.style.background = this.currentStoryBackground;
      }
      return;
    }

    // Optimization: use passed MediaElement if available to avoid querySelector
    let mediaElement = existingMediaElement;
    if (!mediaElement) {
      const activeStoryContent = activeStoryContainer.nativeElement.querySelector('.story-content.active');
      if (!activeStoryContent) return;
      mediaElement = activeStoryContent.querySelector('img, video');
    }

    if (mediaElement) {
      try {
        const hexOrRgbColors = this.getDominantColors(mediaElement as HTMLImageElement | HTMLVideoElement);
        // Parse returned colors to RGB arrays for interpolation
        this.targetColors = hexOrRgbColors.map(c => this.storyUtilityService.parseColor(c));

        // If it's an image (not video loop), we might want to snap or animate once.
        // But since updateBackground is called once for images, we can just apply it.
        if (mediaElement.tagName.toLowerCase() === 'img') {
          this.currentColors = this.targetColors;
          this.applyGradient(activeStoryContainer.nativeElement);
        }

      } catch (e) {
        this.targetColors = this.storyUtilityService.getDefaultParsedColors(this.options);
      }
    } else {
      this.targetColors = this.storyUtilityService.getDefaultParsedColors(this.options);
    }
  }

  /**
   * Starts a loop to update the background gradient based on the video content.
   * Runs outside Angular to improve performance.
   * @param videoElement The video element source.
   */
  startVideoBackgroundUpdate(videoElement: HTMLVideoElement) {
    if (!this.options.enableGradientBackground) return;
    this.stopVideoBackgroundUpdate();
    let frameCount = 0;

    // Cache the story container element to avoid re-querying active container every frame
    const activeStoryContainer = this.storyContainers.toArray()[this.currentStoryGroupIndex];
    const containerNativeElement = activeStoryContainer?.nativeElement;

    if (!containerNativeElement) return;

    this.ngZone.runOutsideAngular(() => {
      const update = () => {
        if (videoElement.paused || videoElement.ended) {
          this.stopVideoBackgroundUpdate();
          return;
        }

        // 1. Update Target Colors (Throttled every 30 frames for better performance)
        if (frameCount % 30 === 0) {
          // Pass videoElement to avoid querySelector overhead
          this.updateBackground(videoElement); // This updates this.targetColors
        }

        // 2. Interpolate Current Colors towards Target Colors (Every Frame)
        // Factor 0.03 for smooth, optimized transition.
        const factor = 0.03;
        this.currentColors = [
          this.storyUtilityService.lerpColor(this.currentColors[0], this.targetColors[0], factor),
          this.storyUtilityService.lerpColor(this.currentColors[1], this.targetColors[1], factor)
        ];

        // 3. Apply to DOM
        this.applyGradient(containerNativeElement);

        frameCount++;
        this.videoFrameId = requestAnimationFrame(update);
      };
      this.videoFrameId = requestAnimationFrame(update);
    });
  }

  private applyGradient(containerElement?: HTMLElement) {
    const c1 = `rgb(${Math.round(this.currentColors[0][0])}, ${Math.round(this.currentColors[0][1])}, ${Math.round(this.currentColors[0][2])})`;
    const c2 = `rgb(${Math.round(this.currentColors[1][0])}, ${Math.round(this.currentColors[1][1])}, ${Math.round(this.currentColors[1][2])})`;
    this.currentStoryBackground = `linear-gradient(to bottom, ${c1}, ${c2})`;

    // Direct DOM manipulation to avoid change detection on every frame
    if (containerElement) {
      const backgroundEl = containerElement.querySelector('.story-style') as HTMLElement;
      if (backgroundEl) {
        backgroundEl.style.background = this.currentStoryBackground;
      }
    }
  }

  stopVideoBackgroundUpdate() {
    if (this.videoFrameId) {
      cancelAnimationFrame(this.videoFrameId);
      this.videoFrameId = null;
    }
  }

  /**
   * Analyzes the image/video source to extract dominant colors for the gradient background.
   * @param source The HTMLImageElement or HTMLVideoElement to analyze.
   * @returns An array of two color strings (rgb format).
   */
  getDominantColors(source: HTMLImageElement | HTMLVideoElement): string[] {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 50;
      this.canvas.height = 50;
      // Optimize for frequent reads
      this.context = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    // Fallback if context is not available
    const defaultColor = this.options.backlitColor || '#1b1b1b';
    if (!this.context) return [defaultColor, defaultColor];

    try {
      this.context.drawImage(source, 0, 0, 50, 50);
      const imageData = this.context.getImageData(0, 0, 50, 50);
      const data = imageData.data;
      const colorCounts: { [key: string]: number } = {};

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue; // Skip transparent pixels

        // Simple brightness check
        const brightness = (r + g + b) / 3;
        // Exclude very dark colors (< 40) to avoid black/near-black
        if (brightness < 40) continue;

        // Quantize to nearest 20 to group similar colors
        const qR = Math.round(r / 20) * 20;
        const qG = Math.round(g / 20) * 20;
        const qB = Math.round(b / 20) * 20;

        const key = `${qR},${qG},${qB}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }

      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);

      if (sortedColors.length === 0) return ['#000000', '#000000'];
      if (sortedColors.length === 1) return [`rgb(${sortedColors[0]})`, `rgb(${sortedColors[0]})`];

      return [`rgb(${sortedColors[0]})`, `rgb(${sortedColors[1]})`];

    } catch (e) {
      console.warn('ngx-stories: Failed to extract gradient colors, using default background.', e);
      return [defaultColor, defaultColor];
    }
  }
}