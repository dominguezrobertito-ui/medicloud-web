import { provideServerRendering, withRoutes } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

export const config = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
  ],
};
