import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Bootstrapping (initializing) the Angular application with the root component (AppComponent) 
// and the configuration settings (appConfig).
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
