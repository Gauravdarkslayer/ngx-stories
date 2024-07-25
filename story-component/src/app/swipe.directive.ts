import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[swipe]',
  standalone: true
})
export class SwipeDirective {
  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();
  private startX!: number;
  private startTime!: number;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.startX = event.changedTouches[0].screenX;
    this.startTime = new Date().getTime();
    console.log(this.startX);
    
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0].screenX;
    const endTime = new Date().getTime();
    const deltaX = endX - this.startX;
    const deltaTime = endTime - this.startTime;

    if (Math.abs(deltaX) > 30 && deltaTime < 300) {
      console.log(deltaX);
      
      if (deltaX > 0) {
      alert(2)
      this.swipeRight.emit();
      } else {
        this.swipeLeft.emit();
      }
    }
  }
}
