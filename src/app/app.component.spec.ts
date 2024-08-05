import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { By } from '@angular/platform-browser';
import { HammerModule } from '@angular/platform-browser';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HammerModule],
      declarations: [AppComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should start story progress on init', () => {
    spyOn(component, 'startStoryProgress');
    component.ngOnInit();
    expect(component.startStoryProgress).toHaveBeenCalled();
  });

  it('should clear interval on destroy', () => {
    spyOn(window, 'clearInterval');
    component.ngOnDestroy();
    expect(clearInterval).toHaveBeenCalledWith(component.intervalId);
  });

  it('should initialize Hammer.js on AfterViewInit', () => {
    spyOn(component, 'initHammer');
    component.ngAfterViewInit();
    expect(component.initHammer).toHaveBeenCalled();
  });

  it('should handle swipe left', () => {
    spyOn(component, 'handleSwipe');
    component.initHammer();
    component.storyContainers.forEach(container => {
      container.nativeElement.dispatchEvent(new Event('swipeleft'));
    });
    expect(component.handleSwipe).toHaveBeenCalledWith('left');
  });

  it('should handle swipe right', () => {
    spyOn(component, 'handleSwipe');
    component.initHammer();
    component.storyContainers.forEach(container => {
      container.nativeElement.dispatchEvent(new Event('swiperight'));
    });
    expect(component.handleSwipe).toHaveBeenCalledWith('right');
  });

  it('should handle swipe down', () => {
    spyOn(component, 'handleSwipe');
    component.initHammer();
    component.storyContainers.forEach(container => {
      container.nativeElement.dispatchEvent(new Event('swipedown'));
    });
    expect(component.handleSwipe).toHaveBeenCalledWith('down');
  });

  it('should handle swipe up', () => {
    spyOn(component, 'handleSwipe');
    component.initHammer();
    component.storyContainers.forEach(container => {
      container.nativeElement.dispatchEvent(new Event('swipeup'));
    });
    expect(component.handleSwipe).toHaveBeenCalledWith('up');
  });

  it('should handle swipe direction correctly', () => {
    spyOn(component, 'nextPersonStory');
    spyOn(component, 'prevPersonStory');
    spyOn(component, 'onExit');
    spyOn(component, 'onSwipeUpTriggered');
    
    component.handleSwipe('left');
    expect(component.isSwipingLeft).toBeTrue();
    expect(component.nextPersonStory).toHaveBeenCalled();

    component.handleSwipe('right');
    expect(component.isSwipingRight).toBeTrue();
    expect(component.prevPersonStory).toHaveBeenCalled();

    component.handleSwipe('down');
    expect(clearInterval).toHaveBeenCalledWith(component.intervalId);
    expect(component.onExit).toHaveBeenCalled();

    component.handleSwipe('up');
    expect(component.onSwipeUpTriggered).toHaveBeenCalled();
  });

  it('should reset swipe status', () => {
    component.isSwipingLeft = true;
    component.isSwipingRight = true;
    component.resetSwipe();
    expect(component.isSwipingLeft).toBeFalse();
    expect(component.isSwipingRight).toBeFalse();
  });

  it('should start story progress', () => {
    spyOn(window, 'setInterval').and.callThrough();
    component.startStoryProgress();
    expect(component.intervalId).toBeDefined();
  });

  it('should handle hold and release', () => {
    component.onHold();
    expect(component.isHolding).toBeTrue();
    expect(clearInterval).toHaveBeenCalledWith(component.intervalId);

    spyOn(component, 'startStoryProgress');
    component.onRelease();
    expect(component.isHolding).toBeFalse();
    expect(component.startStoryProgress).toHaveBeenCalled();
  });

  it('should disable context menu', () => {
    const event = new MouseEvent('contextmenu');
    spyOn(event, 'preventDefault');
    component.disableContextMenu(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });
});
