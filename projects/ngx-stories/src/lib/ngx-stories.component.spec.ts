import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgxStoriesComponent } from './ngx-stories.component';
import { StoryGroup } from './interfaces/interfaces';

describe('NgxStoriesComponent', () => {
  let component: NgxStoriesComponent;
  let fixture: ComponentFixture<NgxStoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxStoriesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxStoriesComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy(); // This checks if the component is created successfully
  });

  it('should start progress interval for an image story', () => {
    const fixture = TestBed.createComponent(NgxStoriesComponent);
    const component = fixture.componentInstance;

    component.storyGroups = [{
      id: 1,
      name: 'Test Group',
      stories: [{ id: 1, type: 'image', content: 'image_url.jpg' }]
    }];

    fixture.detectChanges();

    spyOn(component, 'startProgressInterval');
    component.startStoryProgress();

    expect(component.startProgressInterval).toHaveBeenCalledWith(5000);  // default duration
  });
  
  it('should accept storyGroups input and display stories', () => {
    const mockStoryGroups: StoryGroup[] = [
      {
        id: 1,
        name: 'Gaurav',
        stories: [
          { id: 1, type: 'image', content: 'https://example.com/story1.jpg' },
          { id: 2, type: 'image', content: 'https://example.com/story2.jpg' },
        ],
      },
    ];

    component.storyGroups = mockStoryGroups;
    fixture.detectChanges();

    expect(component.storyGroups.length).toBe(1);
    expect(component.storyGroups[0].name).toBe('Gaurav');
    expect(component.storyGroups[0].stories.length).toBe(2);
  });
});
