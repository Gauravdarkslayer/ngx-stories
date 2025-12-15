import { ComponentFixture, fakeAsync, TestBed, tick, flush } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NgxStoriesComponent } from './ngx-stories.component';
import { StoryGroup } from './interfaces/interfaces';
import { NgxStoriesService } from './ngx-stories.service';

@Component({ template: '' })
class DummyComponent { }

class MockNgxStoriesService {
  assignIdsIfMissing(groups: StoryGroup[]) { return groups; }
  startProgress() { return 1; } // return fake interval id
  renderComponent() { }
  isImageCached() { return true; }
  nextStory() { return { storyGroupIndex: 0, storyIndex: 0 }; }
  prevStory() { return { storyGroupIndex: 0, storyIndex: 0 }; }
  setOptions() { }

  parseColor(colorStr: string): number[] {
    if (colorStr.startsWith('#')) {
      const hex = colorStr.substring(1);
      const bigint = parseInt(hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return [r, g, b];
    }
    return [0, 0, 0];
  }

  lerpColor(start: number[], end: number[], t: number): number[] {
    return start; // minimal mock
  }

  getDefaultParsedColors(options: any): number[][] {
    return [[27, 27, 27], [27, 27, 27]]; // Mocking #1b1b1b parsing results
  }
}

describe('NgxStoriesComponent', () => {
  let component: NgxStoriesComponent;
  let fixture: ComponentFixture<NgxStoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxStoriesComponent],
      providers: [
        { provide: NgxStoriesService, useClass: MockNgxStoriesService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NgxStoriesComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy(); // This checks if the component is created successfully
  });

  it('should accept storyGroups input and display stories', () => {
    const mockStoryGroups: StoryGroup[] = [
      {
        id: '1',
        name: 'Gaurav',
        stories: [
          { id: '1', type: 'image', content: 'https://example.com/story1.jpg' },
          { id: '2', type: 'image', content: 'https://example.com/story2.jpg' },
        ],
      },
    ];

    component.storyGroups = mockStoryGroups;
    fixture.detectChanges();

    expect(component.storyGroups.length).toBe(1);
    expect(component.storyGroups[0].name).toBe('Gaurav');
    expect(component.storyGroups[0].stories.length).toBe(2);
  });

  it('should enable gradient background by default', () => {
    const mockGroups: StoryGroup[] = [{
      id: '1', name: 'Test', stories: [{ id: '1', type: 'image', content: 'img.jpg' }]
    }];
    component.storyGroups = mockGroups;
    component.options = {};
    component.ngOnInit();
    expect(component.options.enableGradientBackground).toBeTrue();
  });

  it('should disable gradient background when configured', () => {
    const mockGroups: StoryGroup[] = [{
      id: '1', name: 'Test', stories: [{ id: '1', type: 'image', content: 'img.jpg' }]
    }];
    component.storyGroups = mockGroups;
    component.options = { enableGradientBackground: false };
    component.ngOnInit();
    expect(component.options.enableGradientBackground).toBeFalse();
  });

  it('should set background to black for component stories', fakeAsync(() => {
    const mockGroups: StoryGroup[] = [{
      id: '1', name: 'Test', stories: [
        { id: '1', type: 'component', content: DummyComponent }
      ]
    }];
    component.storyGroups = mockGroups;
    component.ngOnInit();

    // Process the setTimeout in startStoryProgress
    tick(5000);

    fixture.detectChanges();

    // updateBackground calls logic dependent on current story
    component.currentStoryGroupIndex = 0;
    component.currentStoryIndex = 0;
    component.updateBackground();

    expect(component.currentStoryBackground).toBe('#1b1b1b');
    flush();
  }));

  it('should set background to black if feature is disabled', fakeAsync(() => {
    const mockGroups: StoryGroup[] = [{
      id: '1', name: 'Test', stories: [
        { id: '1', type: 'image', content: 'img.jpg' }
      ]
    }];
    component.storyGroups = mockGroups;
    component.options = { enableGradientBackground: false };
    component.ngOnInit();
    tick(5000);
    fixture.detectChanges();

    component.currentStoryGroupIndex = 0;
    component.currentStoryIndex = 0;
    component.updateBackground();

    expect(component.currentStoryBackground).toBe('#1b1b1b');
    flush();
  }));

  it('should reset background on transition', fakeAsync(() => {
    const mockGroups: StoryGroup[] = [{
      id: '1', name: 'Test', stories: [
        { id: '1', type: 'image', content: 'img1.jpg' },
        { id: '2', type: 'image', content: 'img2.jpg' }
      ]
    }];
    component.storyGroups = mockGroups;
    component.ngOnInit();
    tick(5000);
    fixture.detectChanges();

    // Set some background manually
    component.currentStoryBackground = 'linear-gradient(...)';

    // Call private method resetBackground via caching spy or checking side effect
    (component as any).resetBackground();

    expect(component.currentStoryBackground).toBe('#1b1b1b');
    expect((component as any).currentColors).toEqual([[27, 27, 27], [27, 27, 27]]);
    flush();
  }));
});
