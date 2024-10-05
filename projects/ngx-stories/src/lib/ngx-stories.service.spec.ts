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

  // Testing the startProgress function
  describe('startProgress', () => {
    it('should call callback at the given interval', (done) => {
      const callback = jasmine.createSpy('callback');
      const interval = 100;

      const intervalId = service.startProgress(interval, callback);

      // Wait for the interval time + some buffer and check if the callback was called
      setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(1);
        service.clearProgress(intervalId);
        done();
      }, interval + 50);
    });
  });

  // Testing the clearProgress function
  describe('clearProgress', () => {
    it('should clear the interval', (done) => {
      const callback = jasmine.createSpy('callback');
      const interval = 100;

      const intervalId = service.startProgress(interval, callback);
      service.clearProgress(intervalId);

      // Ensure that the callback is not called after clearing the interval
      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      }, interval + 50);
    });
  });

  // Testing the nextStory function
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

    // Test to ensure the service moves to the next story within the same storyGroup
    it('should move to the next story within the same storyGroup', () => {
      const result = service.nextStory(storyGroups, 0, 0, onStoryGroupChangeMock);// // Start at storyGroup 0, story 0
      expect(result.storyGroupIndex).toBe(0);
      expect(result.storyIndex).toBe(1);
    });

    // Test to ensure the service moves to the next storyGroup when the last story is reached
    it('should move to the next storyGroup if current story is the last one', () => {
      const result = service.nextStory(storyGroups, 0, 2, onStoryGroupChangeMock); // Start at storyGroup 0, story 2(last story)
      expect(result.storyGroupIndex).toBe(1); //Move to the next storyGroup
      expect(result.storyIndex).toBe(0); //first story of the next storyGroup
    });
  });

  // Testing the prevStory function
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

    // Test to ensure the service moves to the previous story within the same storyGroup
    it('should move to the previous story within the same storyGroup', () => {
      const result = service.prevStory(storyGroups, 0, 2, onStoryGroupChangeMock);// Start at storyGroup 0, story 2
      expect(result.storyGroupIndex).toBe(0);
      expect(result.storyIndex).toBe(1);
    });

    // Test to ensure the service moves to the previous storyGroup when the first story is reached
    it('should move to the previous storyGroup if current story is the first one', () => {
      const result = service.prevStory(storyGroups, 1, 0, onStoryGroupChangeMock);// Start at storyGroup 1, story 0
      expect(result.storyGroupIndex).toBe(0); //Move to the previous storyGroup
      expect(result.storyIndex).toBe(2); //last story of the previous storyGroup
    });

    // Test to ensure that no change occurs if already on the first story of the first storyGroup
    it('should do nothing if on the first story of the first storyGroup', () => {
      const result = service.prevStory(storyGroups, 0, 0, onStoryGroupChangeMock); 
      expect(result.storyGroupIndex).toBe(0);
      expect(result.storyIndex).toBe(0); //No change rermain on the first story of the first storyGroup
    });
  });

});

