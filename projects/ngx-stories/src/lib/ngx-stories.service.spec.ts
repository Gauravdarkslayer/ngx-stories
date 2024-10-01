import { TestBed } from '@angular/core/testing';

import { NgxStoriesService } from './ngx-stories.service';
import { StoryGroup } from './interfaces/interfaces';

describe('NgxStoriesService', () => {
  let service: NgxStoriesService;
  let onStoryGroupChangeMock: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxStoriesService);
    onStoryGroupChangeMock = jasmine.createSpy('onStoryGroupChange');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('startProgress', () => {
    it('should call callback at the given interval', (done) => {
      const callback = jasmine.createSpy('callback');
      const interval = 100;

      const intervalId = service.startProgress(interval, callback);

      setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(1);
        service.clearProgress(intervalId); // Clean up
        done();
      }, interval + 50);
    });
  });

  describe('clearProgress', () => {
    it('should clear the interval', (done) => {
      const callback = jasmine.createSpy('callback');
      const interval = 100;

      const intervalId = service.startProgress(interval, callback);
      service.clearProgress(intervalId);

      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      }, interval + 50);
    });
  });

  describe('nextStory', () => {
    const storyGroups: StoryGroup[] = [
      {
        id: 1,
        name: 'John Doe',
        stories: [
          { id: 1, type: 'image', content: 'assets/story1.jpg' },
          { id: 2, type: 'video', content: 'assets/story2.mp4' },
          { id: 3, type: 'image', content: 'assets/story3.jpg' }
        ]
      },
      {
        id: 2,
        name: 'Jane Smith',
        stories: [
          { id: 1, type: 'image', content: 'assets/story4.jpg' },
          { id: 2, type: 'video', content: 'assets/story5.mp4' }
        ]
      }
    ];

    it('should move to the next story within the same storyGroup', () => {
      const result = service.nextStory(storyGroups, 0, 0, onStoryGroupChangeMock); // Start at storyGroup 0, story 0
      expect(result.storyGroupIndex).toBe(0);
      expect(result.storyIndex).toBe(1);
    });

    it('should move to the next storyGroup if current story is the last one', () => {
      const result = service.nextStory(storyGroups, 0, 2, onStoryGroupChangeMock); // Start at storyGroup 0, story 2 (last story)
      expect(result.storyGroupIndex).toBe(1); // Moved to next storyGroup
      expect(result.storyIndex).toBe(0); // First story of the next storyGroup
    });

  });


  describe('prevStory', () => {
    const storyGroups: StoryGroup[] = [
      {
        id: 1,
        name: 'John Doe',
        stories: [
          { id: 1, type: 'image', content: 'assets/story1.jpg' },
          { id: 2, type: 'video', content: 'assets/story2.mp4' },
          { id: 3, type: 'image', content: 'assets/story3.jpg' }
        ]
      },
      {
        id: 2,
        name: 'Jane Smith',
        stories: [
          { id: 1, type: 'image', content: 'assets/story4.jpg' },
          { id: 2, type: 'video', content: 'assets/story5.mp4' }
        ]
      }
    ];

    it('should move to the previous story within the same storyGroup', () => {
      const result = service.prevStory(storyGroups, 0, 2, onStoryGroupChangeMock); // Start at storyGroup 0, story 2
      expect(result.storyGroupIndex).toBe(0);
      expect(result.storyIndex).toBe(1);
    });

    it('should move to the previous storyGroup if current story is the first one', () => {
      const result = service.prevStory(storyGroups, 1, 0, onStoryGroupChangeMock); // Start at storyGroup 1, story 0
      expect(result.storyGroupIndex).toBe(0); // Moved to previous storyGroup
      expect(result.storyIndex).toBe(2); // Last story of the previous storyGroup
    });

    it('should do nothing if on the first story of the first storyGroup', () => {
      const result = service.prevStory(storyGroups, 0, 0, onStoryGroupChangeMock); // First story of the first storyGroup
      expect(result.storyGroupIndex).toBe(0);
      expect(result.storyIndex).toBe(0); // Remains at the first story
    });
  });

});
