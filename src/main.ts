import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import './app/app.css';
import 'zone.js';



bootstrapApplication(App, appConfig).catch((err) => console.error(err));
