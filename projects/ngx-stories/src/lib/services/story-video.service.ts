import { Injectable, ElementRef, QueryList } from '@angular/core';

/**
 * Service to manage video playback and audio state within stories.
 */
@Injectable()
export class StoryVideoService {
    isAudioEnabled = false;

    /**
     * Toggles the audio state and updates the current video element if provided.
     */
    toggleAudio(videoElement: HTMLVideoElement | null): boolean {
        this.isAudioEnabled = !this.isAudioEnabled;
        if (videoElement) {
            videoElement.muted = !this.isAudioEnabled;
        }
        return this.isAudioEnabled;
    }

    /**
     * Pauses all videos in the provided story containers.
     */
    pauseAllVideos(storyContainers: QueryList<ElementRef>, seekToStart = false): void {
        storyContainers?.forEach(container => {
            const videos = container.nativeElement.querySelectorAll('video');
            videos.forEach((video: HTMLVideoElement) => {
                video.pause();
                if (seekToStart) {
                    video.currentTime = 0;
                }
            });
        });
    }

    /**
     * Plays the given video element with autoplay failure handling.
     */
    playVideoWithRetry(videoElement: HTMLVideoElement | null, onFallback: () => void, onError: (err: any) => void): void {
        if (videoElement) {
            videoElement.muted = !this.isAudioEnabled;
            videoElement.play().catch(err => {
                console.warn('ngx-stories: Autoplay failed, attempting to play muted:', err);
                // If autoplay fails (likely due to unmuted blocking), try playing muted
                videoElement.muted = true;
                videoElement.play().then(() => {
                    // If successful, update our state to reflect it's now muted
                    this.isAudioEnabled = false;
                    onFallback();
                }).catch(mutedErr => {
                    // If it still fails, it might be low power mode or other restriction
                    console.error('ngx-stories: Video playback failed completely:', mutedErr);
                    onError(mutedErr);
                });
            });
        }
    }

    /**
     * Finds the active video element within a story container list.
     */
    getActiveVideoElement(storyContainers: QueryList<ElementRef>, groupIndex: number): HTMLVideoElement | null {
        const activeStoryContainer = storyContainers.toArray()[groupIndex];
        if (!activeStoryContainer) return null;
        const activeStoryContent = activeStoryContainer.nativeElement.querySelector('.story-content.active');
        return activeStoryContent?.querySelector('video') || null;
    }
}
