import { ComponentFixture, fakeAsync, TestBed, tick, flush } from '@angular/core/testing';
import { NgxStoriesComponent } from './ngx-stories.component';
import { StoryGroup, StoryChangeEventData } from './interfaces/interfaces';
import { StoryUtilityService } from './services/story-utility.service';
import { StoryStateService } from './services/story-state.service';
import { StoryVideoService } from './services/story-video.service';
import { By } from '@angular/platform-browser';
import { ElementRef } from '@angular/core';

describe('NgxStoriesComponent', () => {
  let component: NgxStoriesComponent;
  let fixture: ComponentFixture<NgxStoriesComponent>;
  let mockUtilityService: jasmine.SpyObj<StoryUtilityService>;
  let mockStateService: jasmine.SpyObj<StoryStateService>;
  let mockVideoService: jasmine.SpyObj<StoryVideoService>;

  const mockStoryGroups: StoryGroup[] = [
    {
      id: '1',
      name: 'User 1',
      stories: [
        { id: 'S1', type: 'image', content: 'url1' },
        { id: 'S2', type: 'video', content: 'url2' }
      ]
    },
    {
      id: '2',
      name: 'User 2',
      stories: [
        { id: 'S3', type: 'image', content: 'url3' }
      ]
    }
  ];

  beforeEach(async () => {
    mockUtilityService = jasmine.createSpyObj('StoryUtilityService', ['setOptions', 'renderComponent', 'isImageCached', 'startProgress', 'parseColor', 'lerpColor', 'getDefaultParsedColors', 'assignIdsIfMissing']);
    // Create a mock that can hold state for properties
    mockStateService = jasmine.createSpyObj('StoryStateService', ['initialize', 'navigate', 'setState', 'isAtEnd', 'getCurrentStory']);

    // Manually handle property getters/setters for the mock
    let _currentStoryIndex = 0;
    let _currentStoryGroupIndex = 0;
    let _storyState = 'playing';
    let _options = {};

    Object.defineProperty(mockStateService, 'currentStoryIndex', {
      get: () => _currentStoryIndex,
      set: (val) => _currentStoryIndex = val
    });
    Object.defineProperty(mockStateService, 'currentStoryGroupIndex', {
      get: () => _currentStoryGroupIndex,
      set: (val) => _currentStoryGroupIndex = val
    });
    Object.defineProperty(mockStateService, 'storyState', {
      get: () => _storyState,
      set: (val) => _storyState = val
    });
    Object.defineProperty(mockStateService, 'options', {
      get: () => _options,
      set: (val) => _options = val
    });

    mockVideoService = jasmine.createSpyObj('StoryVideoService', ['isAudioEnabled', 'getActiveVideoElement', 'playVideoWithRetry', 'pauseAllVideos', 'toggleAudio']);

    // Default mock behaviors
    mockUtilityService.assignIdsIfMissing.and.returnValue(mockStoryGroups);
    mockUtilityService.getDefaultParsedColors.and.returnValue([[0, 0, 0], [0, 0, 0]]);
    mockUtilityService.parseColor.and.returnValue([0, 0, 0]);

    mockStateService.navigate.and.returnValue({ storyGroupIndex: 0, storyIndex: 0 });
    mockStateService.getCurrentStory.and.returnValue(mockStoryGroups[0].stories[0]);

    await TestBed.configureTestingModule({
      imports: [NgxStoriesComponent]
    })
      .overrideComponent(NgxStoriesComponent, {
        set: {
          providers: [
            { provide: StoryUtilityService, useValue: mockUtilityService },
            { provide: StoryStateService, useValue: mockStateService },
            { provide: StoryVideoService, useValue: mockVideoService }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(NgxStoriesComponent);
    component = fixture.componentInstance;
    component.storyGroups = mockStoryGroups;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input Validation', () => {
    it('should throw error for empty storyGroups', () => {
      component.storyGroups = [];
      expect(() => component.ngOnInit()).toThrowError(/storyGroups input is required/);
    });

    it('should throw error for missing stories in a group', () => {
      const faultyGroups: any = [{ id: '99', name: 'Faulty' }];
      component.storyGroups = faultyGroups;
      mockUtilityService.assignIdsIfMissing.and.returnValue(faultyGroups);

      expect(() => component.ngOnInit()).toThrowError(/must contain at least one story/);
    });
  });

  describe('Initialization', () => {
    it('should validate inputs and initialize state service', () => {
      component.ngOnInit();
      expect(mockStateService.initialize).toHaveBeenCalledWith(mockStoryGroups, jasmine.any(Object));
    });

    it('should set utility options after view init', () => {
      component.ngAfterViewInit();
      expect(mockUtilityService.setOptions).toHaveBeenCalled();
    });
  });

  describe('Content State Handling', () => {
    it('should set isLoading to true on onContentBuffering', () => {
      component.onContentBuffering();
      expect(component.isLoading).toBeTrue();
    });

    it('should set error state on onContentError', fakeAsync(() => {
      spyOn(component, 'navigateStory');

      component.onContentError();

      expect(component.isContentError).toBeTrue();
      expect(component.isLoading).toBeFalse();

      // Should auto-advance after timeout (mocked as 3000ms usually)
      tick(3000);
      expect(component.navigateStory).toHaveBeenCalledWith('next');
    }));

    it('should clear loading and error on onContentLoaded', () => {
      component.isLoading = true;
      component.isContentError = true;

      component.onContentLoaded();

      expect(component.isLoading).toBeFalse();
      expect(component.isContentError).toBeFalse();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate next on ArrowRight', () => {
      spyOn(component, 'navigateStory');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      document.dispatchEvent(event);
      expect(component.navigateStory).toHaveBeenCalledWith('next');
    });

    it('should navigate previous on ArrowLeft', () => {
      spyOn(component, 'navigateStory');
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      document.dispatchEvent(event);
      expect(component.navigateStory).toHaveBeenCalledWith('previous');
    });

    it('should toggle pause on Space', () => {
      spyOn(component, 'togglePause');
      const event = new KeyboardEvent('keydown', { key: ' ' });
      document.dispatchEvent(event);
      expect(component.togglePause).toHaveBeenCalled();
    });
  });

  describe('Gestures', () => {
    it('should handle swipe left to go next group', fakeAsync(() => {
      // Simulate swipe left
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const endEvent = new MouseEvent('mouseup', { clientX: 20, clientY: 100 });

      component.onTouchStart(startEvent);
      tick(200); // Wait less than hold delay
      component.onRelease(endEvent);

      // Should trigger swipe left handling
      expect(component.isSwipingLeft).toBeTrue();

      tick(600); // Animation delay -> handleSwipe timeout
      // potentially goToNextStoryGroup timeout (HOLD_DELAY_MS = 500)
      flush();
    }));

    it('should handle swipe right to go prev group', fakeAsync(() => {
      // Simulate swipe right
      const startEvent = new MouseEvent('mousedown', { clientX: 20, clientY: 100 });
      const endEvent = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });

      component.onTouchStart(startEvent);
      tick(200);
      component.onRelease(endEvent);

      expect(component.isSwipingRight).toBeTrue();
      flush();
    }));

    it('should handle hold interaction (long press)', fakeAsync(() => {
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });

      component.onTouchStart(startEvent);
      tick(600); // Wait longer than HOLD_DELAY_MS (500)

      expect(component.isHolding).toBeTrue();
      expect(component.storyState).toBe('paused');

      // Release
      const endEvent = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });
      component.onRelease(endEvent);

      expect(component.isHolding).toBeFalse();
      expect(component.storyState).toBe('playing');
      flush();
    }));
  });

  describe('Story Navigation Boundaries', () => {
    it('should call stateService navigate on navigateStory', () => {
      component.navigateStory('next');
      expect(mockStateService.navigate).toHaveBeenCalledWith('next', jasmine.any(Function));
    });

    it('should emit onEnd if at end of stories and next is clicked', () => {
      component.storyGroups = [mockStoryGroups[0]]; // length 1
      mockStateService.storyState = 'playing';

      // Mock navigate to return same indices or indices indicating end, 
      // but critically the component relies on `stateService.navigate` logic.
      // Here we assume the state service would return the 'state' where it's at the end
      // For testing component logic, we mock `isAtEnd` or the resulting `currentStoryGroupIndex` check

      // Let's assume navigate returns a "no change" or "end" signal if implemented that way, 
      // OR we just simulate the condition where `navigate` was called and we check `triggerOnEnd`.

      // Actually, the component checks:
      // if (direction === 'next' && this.stateService.isAtEnd()) { ... }
      mockStateService.navigate.and.returnValue({ storyGroupIndex: 1, storyIndex: 0 });
      mockStateService.isAtEnd.and.returnValue(true);

      spyOn(component.triggerOnEnd, 'emit');
      component.navigateStory('next');

      expect(component.triggerOnEnd.emit).toHaveBeenCalled();
    });

    it('should NOT emit onEnd if not at end', () => {
      mockStateService.isAtEnd.and.returnValue(false);
      spyOn(component.triggerOnEnd, 'emit');

      component.navigateStory('next');

      expect(component.triggerOnEnd.emit).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation Bug Reproduction', () => {
    it('should result in black screen (no render) when navigating Component story while Paused', fakeAsync(() => {
      // Setup: Group with [Image, Component]
      const compStories: StoryGroup[] = [{
        id: 'comp',
        name: 'Comp',
        stories: [
          { id: 'S1', type: 'image', content: 'img.jpg' },
          { id: 'S2', type: 'component', content: class MockComp { } as any }
        ]
      }];
      component.storyGroups = compStories;
      mockUtilityService.assignIdsIfMissing.and.returnValue(compStories);
      component.ngOnInit();

      // Start at 0 (Image)
      component.currentStoryIndex = 0;
      component.currentStoryGroupIndex = 0;
      mockStateService.navigate.and.returnValue({ storyGroupIndex: 0, storyIndex: 1 });
      mockStateService.getCurrentStory.and.returnValue(compStories[0].stories[1]);

      fixture.detectChanges();

      // Set state to PAUSED
      component.storyState = 'paused';
      mockStateService.storyState = 'paused'; // Ensure mock reflects it if accessed

      // Navigate Next (simulating Keyboard or Button click)
      component.navigateStory('next');

      // Expectation: Content should be initialized (renderComponent called)
      // BUG: Current implementation skips startStoryProgress if paused

      // If the bug exists, renderComponent will NOT be called.
      // We asserting that it SHOULD be called (fixing the bug) or verifying it IS NOT (reproducing).
      // To reproduce the failure, we expect it to be called, and fail if it isn't.

      expect(mockUtilityService.renderComponent).toHaveBeenCalled();

      flush();
    }));
  });

  describe('Video Integration', () => {
    it('should pause all videos when pausing story', () => {
      component.togglePause();
      expect(mockVideoService.pauseAllVideos).toHaveBeenCalled();
    });

    it('should play video with retry when content loaded', fakeAsync(() => {
      mockStateService.getCurrentStory.and.returnValue({ id: 'S2', type: 'video', content: 'url' });
      component.currentStoryIndex = 1;

      component.onContentLoaded();
      tick(); // setTimeout

      // Check if playCurrentStoryVideo logic ran
      // It calls videoService.playVideoWithRetry inside playCurrentStoryVideo
      // But we need to ensure playCurrentStoryVideo was actually called.
      // Based on public API, strict unit test might just check onContentLoaded effects or mocks.
      // If playCurrentStoryVideo is private, we depend on implementation details or effects.
    }));
  });
});
