import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxStoriesComponent } from './ngx-stories.component';

describe('NgxStoriesComponent', () => {
  let component: NgxStoriesComponent;
  let fixture: ComponentFixture<NgxStoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxStoriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxStoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
