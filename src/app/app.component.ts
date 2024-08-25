import { AfterViewInit, Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { NgxStoriesComponent } from '../../projects/ngx-stories/src/public-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxStoriesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  
}
