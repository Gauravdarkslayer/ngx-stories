import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StoryVideoService } from './story-video.service';
import { ElementRef, QueryList } from '@angular/core';

describe('StoryVideoService', () => {
    let service: StoryVideoService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [StoryVideoService]
        });
        service = TestBed.inject(StoryVideoService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('toggleAudio', () => {
        it('should toggle audio state and update video element', () => {
            const mockVideo = document.createElement('video');
            mockVideo.muted = true;
            service.isAudioEnabled = false;

            const result = service.toggleAudio(mockVideo);

            expect(result).toBeTrue();
            expect(service.isAudioEnabled).toBeTrue();
            expect(mockVideo.muted).toBeFalse();

            const result2 = service.toggleAudio(mockVideo);
            expect(result2).toBeFalse();
            expect(service.isAudioEnabled).toBeFalse();
            expect(mockVideo.muted).toBeTrue();
        });

        it('should toggle state even if video element is null', () => {
            service.isAudioEnabled = false;
            const result = service.toggleAudio(null);
            expect(result).toBeTrue();
            expect(service.isAudioEnabled).toBeTrue();
        });
    });

    describe('pauseAllVideos', () => {
        it('should pause all videos in containers', () => {
            const mockVideo1 = jasmine.createSpyObj('HTMLVideoElement', ['pause']);
            const mockVideo2 = jasmine.createSpyObj('HTMLVideoElement', ['pause']);

            const container1 = {
                nativeElement: {
                    querySelectorAll: () => [mockVideo1]
                }
            } as unknown as ElementRef;

            const container2 = {
                nativeElement: {
                    querySelectorAll: () => [mockVideo2]
                }
            } as unknown as ElementRef;

            const mockQueryList = {
                forEach: (fn: (item: ElementRef) => void) => {
                    fn(container1);
                    fn(container2);
                }
            } as QueryList<ElementRef>;

            service.pauseAllVideos(mockQueryList);

            expect(mockVideo1.pause).toHaveBeenCalled();
            expect(mockVideo2.pause).toHaveBeenCalled();
        });
    });

    describe('playVideoWithRetry', () => {
        let mockVideo: jasmine.SpyObj<HTMLVideoElement>;

        beforeEach(() => {
            mockVideo = jasmine.createSpyObj('HTMLVideoElement', ['play']);
            mockVideo.muted = true;
        });

        it('should play video successfully', fakeAsync(() => {
            mockVideo.play.and.returnValue(Promise.resolve());
            const fallbackSpy = jasmine.createSpy('fallback');
            const errorSpy = jasmine.createSpy('error');

            service.playVideoWithRetry(mockVideo, fallbackSpy, errorSpy);
            tick();

            expect(mockVideo.play).toHaveBeenCalled();
            expect(fallbackSpy).not.toHaveBeenCalled();
            expect(errorSpy).not.toHaveBeenCalled();
        }));

        it('should fallback to muted play if initial play fails', fakeAsync(() => {
            // First call fails, second call succeeds
            mockVideo.play.and.returnValues(Promise.reject('Autoplay error'), Promise.resolve());

            const fallbackSpy = jasmine.createSpy('fallback');
            const errorSpy = jasmine.createSpy('error');

            service.playVideoWithRetry(mockVideo, fallbackSpy, errorSpy);

            // Wait for catch block
            tick();
            // Wait for second play promise
            tick();

            expect(mockVideo.muted).toBeTrue();
            expect(mockVideo.play).toHaveBeenCalledTimes(2);
            expect(fallbackSpy).toHaveBeenCalled();
            expect(errorSpy).not.toHaveBeenCalled();
            expect(service.isAudioEnabled).toBeFalse();
        }));

        it('should call onError if both play attempts fail', fakeAsync(() => {
            mockVideo.play.and.returnValue(Promise.reject('Error'));

            const fallbackSpy = jasmine.createSpy('fallback');
            const errorSpy = jasmine.createSpy('error');

            service.playVideoWithRetry(mockVideo, fallbackSpy, errorSpy);

            tick();
            tick();

            expect(errorSpy).toHaveBeenCalled();
        }));
    });
});
