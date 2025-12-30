import { TestBed } from '@angular/core/testing';
import { StoryStateService } from './story-state.service';
import { StoryUtilityService } from './story-utility.service';
import { StoryGroup } from '../interfaces/interfaces';

describe('StoryStateService', () => {
    let service: StoryStateService;
    let mockUtilityService: jasmine.SpyObj<StoryUtilityService>;

    const mockStoryGroups: StoryGroup[] = [
        {
            id: '1',
            name: 'User 1',
            stories: [
                { id: '1-1', type: 'image', content: 'url1' },
                { id: '1-2', type: 'image', content: 'url2' }
            ]
        },
        {
            id: '2',
            name: 'User 2',
            stories: [
                { id: '2-1', type: 'image', content: 'url3' }
            ]
        }
    ];

    beforeEach(() => {
        mockUtilityService = jasmine.createSpyObj('StoryUtilityService', ['assignIdsIfMissing', 'nextStory', 'prevStory']);

        // Default mocks
        mockUtilityService.assignIdsIfMissing.and.returnValue(mockStoryGroups);

        TestBed.configureTestingModule({
            providers: [
                StoryStateService,
                { provide: StoryUtilityService, useValue: mockUtilityService }
            ]
        });
        service = TestBed.inject(StoryStateService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('initialize', () => {
        it('should initialize with provided story groups and options', () => {
            service.initialize(mockStoryGroups, { currentStoryIndex: 1 });

            expect(service.storyGroups).toEqual(mockStoryGroups);
            expect(service.currentStoryIndex).toBe(1);
            expect(service.currentStoryGroupIndex).toBe(0);
            expect(mockUtilityService.assignIdsIfMissing).toHaveBeenCalledWith(mockStoryGroups);
        });
    });

    describe('navigate', () => {
        it('should navigate next using utility service', () => {
            service.initialize(mockStoryGroups, {});
            const mockResult = { storyGroupIndex: 0, storyIndex: 1 };
            mockUtilityService.nextStory.and.returnValue(mockResult);

            const spyCallback = jasmine.createSpy('onGroupChange');

            const result = service.navigate('next', spyCallback);

            expect(mockUtilityService.nextStory).toHaveBeenCalled();
            expect(service.currentStoryIndex).toBe(1);
            expect(result).toEqual(mockResult);
        });

        it('should navigate previous using utility service', () => {
            service.initialize(mockStoryGroups, {});
            const mockResult = { storyGroupIndex: 0, storyIndex: 0 };
            mockUtilityService.prevStory.and.returnValue(mockResult);

            const spyCallback = jasmine.createSpy('onGroupChange');

            const result = service.navigate('previous', spyCallback);

            expect(mockUtilityService.prevStory).toHaveBeenCalled();
            expect(result).toEqual(mockResult);
        });
    });

    describe('setState', () => {
        it('should update the story state', () => {
            service.setState('paused');
            expect(service.storyState).toBe('paused');
        });
    });

    describe('isAtEnd', () => {
        it('should return true when at the end of groups', () => {
            service.initialize(mockStoryGroups, {});
            service.currentStoryGroupIndex = 2; // Last index + 1
            expect(service.isAtEnd()).toBeTrue();
        });

        it('should return false when not at the end', () => {
            service.initialize(mockStoryGroups, {});
            service.currentStoryGroupIndex = 0;
            expect(service.isAtEnd()).toBeFalse();
        });
    });

    describe('getCurrentStory', () => {
        it('should return the current story', () => {
            service.initialize(mockStoryGroups, {});
            const story = service.getCurrentStory();
            expect(story).toBeDefined();
            expect(story?.id).toBe('1-1');
        });

        it('should return null if indices are invalid', () => {
            service.initialize(mockStoryGroups, {});
            service.currentStoryGroupIndex = 5;
            expect(service.getCurrentStory()).toBeNull();
        });
    });
});
