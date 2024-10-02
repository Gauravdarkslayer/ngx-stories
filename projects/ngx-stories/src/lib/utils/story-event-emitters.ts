import { EventEmitter } from '@angular/core';

export const triggerOnEnd: EventEmitter<void> = new EventEmitter<void>();
export const triggerOnExit: EventEmitter<void> = new EventEmitter<void>();
export const triggerOnSwipeUp: EventEmitter<void> = new EventEmitter<void>();
export const onStoryGroupChange: EventEmitter<number> = new EventEmitter<number>();
