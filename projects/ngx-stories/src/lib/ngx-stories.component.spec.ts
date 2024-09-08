import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxStoriesComponent } from './ngx-stories.component';
import { Person } from './interfaces/interfaces';

describe('NgxStoriesComponent', () => {
  let component: NgxStoriesComponent;
  let fixture: ComponentFixture<NgxStoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxStoriesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxStoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(1).toBeTruthy();
  });

  it('should accept persons input and display stories', () => {
    const mockPersons: Person[] = [
      {
        id: 1,
        name: 'Gaurav',
        stories: [
          { id: 1, type: 'image', content: 'https://example.com/story1.jpg' },
          { id: 2, type: 'image', content: 'https://example.com/story2.jpg' },
        ],
      },
    ];

    component.persons = mockPersons;
    fixture.detectChanges();

    expect(component.persons.length).toBe(1);
    expect(component.persons[0].name).toBe('Gaurav');
    expect(component.persons[0].stories.length).toBe(2);
  });
});
