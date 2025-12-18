import { AfterViewInit, Component, ElementRef, Input, Output, QueryList, ViewChildren, HostListener, ViewChild, ViewContainerRef, Type, ChangeDetectorRef } from '@angular/core';
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
  isContentError: boolean = false;
  currentProgressWidth: number = 0;
  isAudioEnabled: boolean = false;
  userInteracted: boolean = false;
  // constants
  readonly HOLD_DELAY_MS = 500;
  readonly PROGRESS_INTERVAL_MS = 50;
  readonly FULL_PROGRESS_WIDTH = 100;
  readonly DEFAULT_STORY_DURATION = 5000;

  // Queries the story containers in the view for gesture handling
  @ViewChildren('storyContainer') storyContainers!: QueryList<ElementRef>;
  // Add a ViewContainerRef to inject dynamic components
  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef, static: false }) dynamicComponentContainer!: ViewContainerRef;

  private hammerInstances: HammerManager[] = [];
  private initTimeout: any;

  constructor(
    private storyService: NgxStoriesService,
    private cdr: ChangeDetectorRef
  ) { }


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
    this.storyGroups = this.storyService.assignIdsIfMissing(this.storyGroups);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
    clearTimeout(this.initTimeout);
    this.stopVideoBackgroundUpdate();
    this.hammerInstances.forEach(hammer => hammer.destroy());
    this.hammerInstances = [];
  }

  ngAfterViewInit(): void {
    this.initHammer();
    // Delay startStoryProgress to avoid ExpressionChangedAfterItHasBeenCheckedError
    // and ensure ViewChildren are fully initialized for the first story.
    this.initTimeout = setTimeout(() => {
      this.startStoryProgress();
    }, 0);
  }

  startStoryProgress() {
    this.isContentError = false;
    this.onContentBuffering(); // Set loading to true initially
    const currentStory = this.storyGroups[this.currentStoryGroupIndex].stories[this.currentStoryIndex];
    if (currentStory.type === 'video') {
      // Video loading is handled by the template events (loadeddata, playing)
      // which call onContentLoaded()
    } else if (currentStory.type === 'component') {
      // Force change detection to ensure dynamicComponentContainer is updated in the view
      // based on the current index before we try to access it.
      this.cdr.detectChanges();
      if (this.dynamicComponentContainer) {
        this.storyService.renderComponent(this.dynamicComponentContainer, currentStory.content as Type<any>);
        this.onContentLoaded();
      } else {
        console.warn('dynamicComponentContainer not available for component rendering.');
        this.onContentLoaded();
      }
    } else {
      // Handling for images
      const imageElement = document.createElement('img');
      imageElement.crossOrigin = currentStory.crossOrigin === undefined ? 'anonymous' : (currentStory.crossOrigin || null);
      imageElement.src = currentStory.content as string;

      // Check if the image is cached
      if (this.storyService.isImageCached(currentStory.content as string)) {
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
      this.hammerInstances.push(hammer);
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
    this.resetBackground();

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
            console.warn('Autoplay failed, attempting to play muted:', err);
            // If autoplay fails (likely due to unmuted blocking), try playing muted
            videoElement.muted = true;
            videoElement.play().then(() => {
              // If successful, update our state to reflect it's now muted
              this.isAudioEnabled = false;
              this.cdr.detectChanges(); // Update UI icon
            }).catch(mutedErr => {
              // If it still fails, it might be low power mode or other restriction
              console.error('Video playback failed completely:', mutedErr);
              this.onContentError();
            });
          });
          this.startVideoBackgroundUpdate(videoElement);
        }
      }
    }, 0);

  }

  private pauseCurrentVideo(seek: null | boolean = null) {
    this.stopVideoBackgroundUpdate();
    // Pause all videos in all story containers
    this.storyContainers?.forEach(container => {
      const videos = container.nativeElement.querySelectorAll('video');
      videos.forEach((video: HTMLVideoElement) => {
        video.pause();
        if (seek) video.currentTime = 0;
      });
    });
  }

  private resetBackground() {
    const defaultColor = this.options.backlitColor || '#1b1b1b';
    this.currentStoryBackground = defaultColor;
    const parsedRef = this.storyService.parseColor(defaultColor);
    this.currentColors = [[...parsedRef], [...parsedRef]];
    this.targetColors = [[...parsedRef], [...parsedRef]];
    this.cdr.detectChanges();
  }

  private goToNextStoryGroup() {
    this.pauseCurrentVideo(true);
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentStoryGroupIndex = (this.currentStoryGroupIndex + 1) % this.storyGroups.length;
    if (this.hasReachedEndOfStories()) return;
    this.currentStoryIndex = 0;
    this.resetBackground();
    clearInterval(this.intervalId);
    this.progressWidth = 0;
    this.storyGroupChange();
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, this.HOLD_DELAY_MS); // Match this timeout with the CSS transition duration
  }

  private goToPreviousStoryGroup() {
    this.pauseCurrentVideo(true); // <-- Add this line
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentStoryIndex = 0;
    this.resetBackground();
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

  private videoFrameId: any;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  // Store current and target colors for interpolation
  private currentColors: number[][] = [[0, 0, 0], [0, 0, 0]];
  private targetColors: number[][] = [[0, 0, 0], [0, 0, 0]];

  currentStoryBackground: string = 'black';

  // ...

  // When content (image or video) has loaded
  onContentLoaded() {
    this.isLoading = false;
    const currentStory = this.storyGroups[this.currentStoryGroupIndex].stories[this.currentStoryIndex];

    if (currentStory.type === 'video') {
      const activeStoryContainer = this.storyContainers.toArray()[this.currentStoryGroupIndex];
      const activeStoryContent = activeStoryContainer?.nativeElement.querySelector('.story-content.active');
      const videoElement: HTMLVideoElement | null = activeStoryContent?.querySelector('video');
      let storyDuration = this.DEFAULT_STORY_DURATION;
      if (videoElement && isFinite(videoElement.duration) && videoElement.duration > 0) {
        storyDuration = videoElement.duration * 1000;
      }
      this.startProgressInterval(storyDuration);
    } else {
      // For images and components, use the default duration or a configurable one
      this.startProgressInterval(this.DEFAULT_STORY_DURATION);
    }

    setTimeout(() => {
      // For images, we can update immediately or animate. 
      // Let's just update immediately for now, or let the loop handle it if it's a video.
      this.updateBackground();
    }, 0);
  }

  updateBackground() {
    if (!this.storyContainers) return;
    const activeStoryContainer = this.storyContainers.toArray()[this.currentStoryGroupIndex];
    if (!activeStoryContainer) return;

    // Check if current story is a component or if gradient background is disabled
    const currentStory = this.storyGroups[this.currentStoryGroupIndex].stories[this.currentStoryIndex];
    if (currentStory.type === 'component' || !this.options.enableGradientBackground) {
      this.currentStoryBackground = this.options.backlitColor || '#1b1b1b';
      return;
    }

    const activeStoryContent = activeStoryContainer.nativeElement.querySelector('.story-content.active');
    if (!activeStoryContent) return;

    const mediaElement = activeStoryContent.querySelector('img, video');
    if (mediaElement) {
      try {
        const hexOrRgbColors = this.getDominantColors(mediaElement);
        // Parse returned colors to RGB arrays for interpolation
        this.targetColors = hexOrRgbColors.map(c => this.storyService.parseColor(c));

        // If it's an image (not video loop), we might want to snap or animate once.
        // But since updateBackground is called once for images, we can just apply it.
        if (mediaElement.tagName.toLowerCase() === 'img') {
          this.currentColors = this.targetColors;
          this.applyGradient();
        }

      } catch (e) {
        this.targetColors = this.storyService.getDefaultParsedColors(this.options);
      }
    } else {
      this.targetColors = this.storyService.getDefaultParsedColors(this.options);
    }
  }

  startVideoBackgroundUpdate(videoElement: HTMLVideoElement) {
    if (!this.options.enableGradientBackground) return;
    this.stopVideoBackgroundUpdate();
    let frameCount = 0;

    const update = () => {
      if (videoElement.paused || videoElement.ended) {
        this.stopVideoBackgroundUpdate();
        return;
      }

      // 1. Update Target Colors (Throttled)
      if (frameCount % 10 === 0) {
        this.updateBackground(); // This updates this.targetColors
      }

      // 2. Interpolate Current Colors towards Target Colors (Every Frame)
      // Factor 0.05 for very smooth, slow transition. 0.1 for faster.
      const factor = 0.05;
      this.currentColors = [
        this.storyService.lerpColor(this.currentColors[0], this.targetColors[0], factor),
        this.storyService.lerpColor(this.currentColors[1], this.targetColors[1], factor)
      ];

      // 3. Apply to DOM
      this.applyGradient();

      frameCount++;
      this.videoFrameId = requestAnimationFrame(update);
    };
    this.videoFrameId = requestAnimationFrame(update);
  }

  private applyGradient() {
    const c1 = `rgb(${Math.round(this.currentColors[0][0])}, ${Math.round(this.currentColors[0][1])}, ${Math.round(this.currentColors[0][2])})`;
    const c2 = `rgb(${Math.round(this.currentColors[1][0])}, ${Math.round(this.currentColors[1][1])}, ${Math.round(this.currentColors[1][2])})`;
    this.currentStoryBackground = `linear-gradient(to bottom, ${c1}, ${c2})`;
  }

  stopVideoBackgroundUpdate() {
    if (this.videoFrameId) {
      cancelAnimationFrame(this.videoFrameId);
      this.videoFrameId = null;
    }
  }

  getDominantColors(source: HTMLImageElement | HTMLVideoElement): string[] {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 50;
      this.canvas.height = 50;
      this.context = this.canvas.getContext('2d');
    }

    if (!this.context) return [this.options.backlitColor || '#1b1b1b', this.options.backlitColor || '#1b1b1b'];

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

        if (a < 128) continue; // Skip transparent

        // Simple brightness check
        const brightness = (r + g + b) / 3;
        // Exclude very dark colors (brightness < 40) to avoid black/near-black in gradients
        if (brightness < 40) continue;

        // Quantize to nearest 20 to group similar colors and reduce noise
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
      console.warn('Failed to extract gradient colors, using default background:', e);
      return [this.options.backlitColor || '#1b1b1b', this.options.backlitColor || '#1b1b1b'];
    }
  }


  // When content is buffering/loading
  onContentBuffering() {
    this.isLoading = true;
  }

  // If there's an error loading content
  onContentError() {
    console.error('Error loading content');
    this.isLoading = false;
    this.isContentError = true;
    this.cdr.detectChanges();
    // Auto-advance after 5s even if error, so user isn't stuck
    this.startProgressInterval(this.DEFAULT_STORY_DURATION);
  }

  toggleAudio() {
    this.isAudioEnabled = !this.isAudioEnabled;
    const activeStoryContainer = this.storyContainers.toArray()[this.currentStoryGroupIndex];
    const activeStoryContent = activeStoryContainer?.nativeElement.querySelector('.story-content.active');
    const videoElement: HTMLVideoElement | null = activeStoryContent?.querySelector('video');
    if (videoElement) {
      videoElement.muted = !this.isAudioEnabled;
    }
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
