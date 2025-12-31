import { TestBed } from '@angular/core/testing';

import { StoryUtilityService } from './story-utility.service';
import { StoryGroup } from '../interfaces/interfaces';

describe('StoryUtilityService', () => {
    let service: StoryUtilityService;
    let onStoryGroupChangeMock: jasmine.Spy;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [StoryUtilityService]
        });
        service = TestBed.inject(StoryUtilityService);
        onStoryGroupChangeMock = jasmine.createSpy('onStoryGroupChange');
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('assignIdsIfMissing', () => {
        it('should assign IDs to groups and stories if missing', () => {
            const groups: StoryGroup[] = [
                {
                    name: 'G1',
                    stories: [{ type: 'image', content: 'c1' }]
                }
            ];
            const result = service.assignIdsIfMissing(groups);

            expect(result[0].id).toBeDefined();
            expect(result[0].stories[0].id).toBeDefined();
        });

        it('should preserve existing IDs', () => {
            const groups: StoryGroup[] = [
                {
                    id: 'existing-g',
                    name: 'G1',
                    stories: [{ id: 'existing-s', type: 'image', content: 'c1' }]
                }
            ];
            const result = service.assignIdsIfMissing(groups);

            expect(result[0].id).toBe('existing-g');
            expect(result[0].stories[0].id).toBe('existing-s');
        });
    });

    describe('startProgress', () => {
        it('should call callback at the given interval', (done) => {
            const callback = jasmine.createSpy('callback');
            const interval = 100;

            const intervalId = service.startProgress(interval, callback);

            setTimeout(() => {
                expect(callback).toHaveBeenCalledTimes(1);
                clearInterval(intervalId); // Clean up
                done();
            }, interval + 50);
        });
    });

    describe('startProgress cleanup', () => {
        it('should stop when interval is cleared', (done) => {
            const callback = jasmine.createSpy('callback');
            const interval = 100;

            const intervalId = service.startProgress(interval, callback);
            clearInterval(intervalId);

            setTimeout(() => {
                expect(callback).not.toHaveBeenCalled();
                done();
            }, interval + 50);
        });
    });

    describe('nextStory', () => {
        const storyGroups: StoryGroup[] = [
            {
                id: '1',
                name: 'John Doe',
                stories: [
                    { id: '1', type: 'image', content: 'assets/test-story-1.png' },
                    { id: '2', type: 'video', content: 'assets/test-video.mp4' },
                    { id: '3', type: 'image', content: 'assets/test-story-2.png' }
                ]
            },
            {
                id: '2',
                name: 'Jane Smith',
                stories: [
                    { id: '1', type: 'image', content: 'assets/test-story-1.png' },
                    { id: '2', type: 'video', content: 'assets/test-video.mp4' }
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
                id: '1',
                name: 'John Doe',
                stories: [
                    { id: '1', type: 'image', content: 'assets/test-story-1.png' },
                    { id: '2', type: 'video', content: 'assets/test-video.mp4' },
                    { id: '3', type: 'image', content: 'assets/test-story-2.png' }
                ]
            },
            {
                id: '2',
                name: 'Jane Smith',
                stories: [
                    { id: '1', type: 'image', content: 'assets/test-story-1.png' },
                    { id: '2', type: 'video', content: 'assets/test-video.mp4' }
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
