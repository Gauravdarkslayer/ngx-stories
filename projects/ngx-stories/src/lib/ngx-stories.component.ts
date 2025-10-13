import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  Output,
  QueryList,
  ViewChildren,
  HostListener,
  ViewChild,
  ViewContainerRef,
  Type
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HammerModule } from '@angular/platform-browser';
import { StoryGroup, StoryStateType } from '../lib/interfaces/interfaces';
import { CommonModule } from '@angular/common';
import { NgxStoriesService } from './ngx-stories.service';
import { NgxStoriesOptions } from '../lib/interfaces/interfaces';
import {
  onStoryGroupChange,
  triggerOnEnd,
  triggerOnExit,
  triggerOnStoryChange,
  triggerOnSwipeUp
} from './utils/story-event-emitters';
import 'hammerjs';
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

  @Input({ required: true }) storyGroups: StoryGroup[] = [];
  @Input() options: NgxStoriesOptions = {};

  @Output() triggerOnEnd = triggerOnEnd;
  @Output() triggerOnExit = triggerOnExit;
  @Output() triggerOnSwipeUp = triggerOnSwipeUp;
  @Output() onStoryGroupChange = onStoryGroupChange;
  @Output() triggerOnStoryChange = triggerOnStoryChange;

  @ViewChildren('storyContainer') storyContainers!: QueryList<ElementRef>;
  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef, static: false }) dynamicComponentContainer!: ViewContainerRef;

  currentStoryIndex = 0;
  currentStoryGroupIndex = 0;
  progressWidth = 0;
  intervalId: any;
  isTransitioning = false;
  isSwipingLeft = false;
  isSwipingRight = false;
  isHolding = false;
  holdTimeout: any;
  storyState: StoryStateType = 'playing';
  isLoading = false;
  currentProgressWidth = 0;
  isAudioEnabled = false;
  userInteracted = false;

  readonly HOLD_DELAY_MS = 500;
  readonly PROGRESS_INTERVAL_MS = 50;
  readonly FULL_PROGRESS_WIDTH = 100;

  constructor(private storyService: NgxStoriesService) {}

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

  // 🔁 Story Progress Logic
  startStoryProgress() {
    this.onContentBuffering();
    const currentStory = this.storyGroups[this.currentStoryGroupIndex].stories[this.currentStoryIndex];
    let storyDuration = 5000;

    if (currentStory.type === 'video') {
      const videoElement: HTMLVideoElement = document.createElement('video');
      videoElement.src = currentStory.content as string;

      videoElement.onloadedmetadata = () => {
        this.onContentLoaded();
        storyDuration = videoElement.duration * 1000;
        this.startProgressInterval(storyDuration);
      };
    } else if (currentStory.type === 'component') {
      setTimeout(() => {
        this.storyService.renderComponent(this.dynamicComponentContainer, currentStory.content as Type<any>);
        this.onContentLoaded();
        this.startProgressInterval(5000);
      }, 100);
    } else {
      const imageElement = document.createElement('img');
      imageElement.src = currentStory.content as string;

      if (this.storyService.isImageCached(currentStory.content as string)) {
        this.onContentLoaded();
        this.startProgressInterval(storyDuration);
      } else {
        imageElement.onload = () => {
          this.onContentLoaded();
          this.startProgressInterval(storyDuration);
        };
      }
    }

    this.populateCurrentDetails(this.currentStoryIndex, this.currentStoryGroupIndex);
  }

  private setStoryOptions() {
    this.options = {
      ...ngxStoriesOptions,
      ...this.options,
    };
    this.currentStoryIndex = this.options.currentStoryIndex as number;
    this.currentStoryGroupIndex = this.options.currentStoryGroupIndex as number;
  }

  startProgressInterval(storyDuration: number) {
    const progressPerTick = this.FULL_PROGRESS_WIDTH / (storyDuration / this.PROGRESS_INTERVAL_MS);
    clearInterval(this.intervalId);

    this.intervalId = this.storyService.startProgress(this.PROGRESS_INTERVAL_MS, () => {
      if (!this.isLoading) {
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
          const stories = this.storyGroups[this.currentStoryGroupIndex]?.stories;
          this.currentStoryIndex = stories?.length - 1;
          if (this.hasReachedEndOfStories()) return;
        }
        this.goToNextStoryGroup();
        this.resetSwipe();
      }, 600);
    } else if (direction === 'right') {
      this.isSwipingRight = true;
      setTimeout(() => {
        this.goToPreviousStoryGroup();
        this.resetSwipe();
      }, 600);
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
    this.pauseCurrentVideo(true);
    this.setTransitionState(true);
    clearInterval(this.intervalId);

    const { storyGroupIndex, storyIndex } =
      direction === 'next'
        ? this.storyService.nextStory(this.storyGroups, this.currentStoryGroupIndex, this.currentStoryIndex, this.storyGroupChange.bind(this))
        : this.storyService.prevStory(this.storyGroups, this.currentStoryGroupIndex, this.currentStoryIndex, this.storyGroupChange.bind(this));

    this.currentStoryGroupIndex = storyGroupIndex;
    this.currentStoryIndex = storyIndex;

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
      const currentStory = this.storyGroups[this.currentStoryGroupIndex]?.stories[this.currentStoryIndex];
      if (currentStory?.type === 'video') {
        const activeStoryContainer = this.storyContainers.toArray()[this.currentStoryGroupIndex];
        const activeStoryContent = activeStoryContainer.nativeElement.querySelector('.story-content.active');
        const videoElement: HTMLVideoElement | null = activeStoryContent.querySelector('video');

        if (videoElement) {
          videoElement.muted = !this.isAudioEnabled;
          videoElement.play().catch(console.error);
        }
      }
    }, 0);
  }

  private pauseCurrentVideo(seek: null | boolean = null) {
    this.storyContainers?.forEach(container => {
      const videos = container.nativeElement.querySelectorAll('video');
      videos.forEach((video: HTMLVideoElement) => {
        video.pause();
        if (seek) video.currentTime = 0;
      });
    });
  }

  private goToNextStoryGroup() {
    this.pauseCurrentVideo(true);
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
    }, this.HOLD_DELAY_MS);
  }

  private goToPreviousStoryGroup() {
    this.pauseCurrentVideo(true);
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentStoryIndex = 0;
    clearInterval(this.intervalId);
    if (this.currentStoryGroupIndex !== 0) {
      this.currentStoryGroupIndex--;
    }
    this.progressWidth = 0;
    this.storyGroupChange();
    setTimeout(() => {
      this.startStoryProgress();
      this.isTransitioning = false;
    }, this.HOLD_DELAY_MS);
  }

  private setTransitionState(isTransitioning: boolean, duration = this.HOLD_DELAY_MS): void {
    this.isTransitioning = isTransitioning;
    setTimeout(() => {
      this.isTransitioning = false;
    }, duration);
  }

  private hasReachedEndOfStories(): boolean {
    const stories = this.storyGroups[this.currentStoryGroupIndex]?.stories;
    if (this.currentStoryIndex === stories.length - 1 && this.currentStoryGroupIndex === this.storyGroups.length - 1) {
      this.onEnd();
      return true;
    }
    return false;
  }

  getProgressValue(storyIndex: number): number {
    if (this.isHolding) return this.progressWidth;
    if (storyIndex < this.currentStoryIndex) return this.FULL_PROGRESS_WIDTH;
    if (storyIndex === this.currentStoryIndex) return this.progressWidth;
    return 0;
  }

  onTouchStart() {
    this.holdTimeout = setTimeout(() => {
      this.onHold();
    }, this.HOLD_DELAY_MS);
  }

  onHold() {
    this.isHolding = true;
    this.storyState = 'paused';
    this.pauseCurrentVideo();
    clearInterval(this.intervalId);
  }

  onRelease() {
    clearTimeout(this.holdTimeout);
    if (this.isHolding) {
      this.isHolding = false;
      this.storyState = 'playing';
      this.startStoryProgress();
      this.playCurrentStoryVideo();
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
      this.playCurrentStoryVideo();
    }
  }

  // ✅ Pause and Resume on Tab Visibility
  pauseStory(): void {
    clearInterval(this.intervalId);
    this.pauseCurrentVideo();
    this.storyState = 'paused';
  }

  resumeStory(): void {
    if (this.storyState === 'paused') {
      this.storyState = 'playing';
      this.startStoryProgress();
      this.playCurrentStoryVideo();
    }
  }

  // ✅ Detect tab visibility change
  @HostListener('document:visibilitychange', [])
  handleVisibilityChange(): void {
    if (document.hidden) {
      this.pauseStory();
    } else {
      this.resumeStory();
    }
  }

  private onEnd() {
    this.triggerOnEnd.emit();
  }

  private onExit() {
    this.triggerOnExit.emit();
  }

  private onSwipeUpTriggered() {
    this.triggerOnSwipeUp.emit();
  }

  private storyGroupChange(index: number = this.currentStoryGroupIndex) {
    this.onStoryGroupChange.emit(index);
  }

  private populateCurrentDetails(currentSIndex: number, currentSGIndex: number) {
    try {
      const dataToSend = {
        currentPerson: this.storyGroups[currentSGIndex].name,
        currentPersonIndex: currentSGIndex,
        currentStory: this.storyGroups[currentSGIndex].stories[currentSIndex],
        currentStoryIndex: currentSIndex,
        previousStory: currentSIndex !== 0 ? this.storyGroups[currentSGIndex].stories[currentSIndex - 1] : null,
        previousStoryIndex: currentSIndex !== 0 ? currentSIndex : null,
      };
      this.triggerOnStoryChange.emit(dataToSend);
    } catch (error) {
      console.error(error);
    }
  }

  onContentLoaded() {
    this.isLoading = false;
  }

  onContentBuffering() {
    this.isLoading = true;
  }

  onContentError() {
    console.error('Error loading content');
    this.isLoading = false;
  }

  toggleAudio() {
    this.isAudioEnabled = !this.isAudioEnabled;
    this.storyContainers.first.nativeElement.querySelector('video').muted = !this.isAudioEnabled;
  }

  @HostListener('document:click', ['$event'])
  onUserInteraction() {
    if (!this.userInteracted) {
      this.userInteracted = true;
      this.isAudioEnabled = true;
    }
  }

  // ✅ Keyboard shortcuts for debug/testing
  @HostListener('document:keydown', ['$event'])
  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.navigateStory('next');
    } else if (event.key === 'ArrowLeft') {
      this.navigateStory('previous');
    } else if (event.key === ' ') {
      event.preventDefault();
      this.togglePause();
    } else if (event.key === 'Escape') {
      this.onExit();
    }
  }
}
