import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { appRoutes } from './app.routes';
import { AuthService } from './core/services/auth.service';
import { globalProgressInterceptor } from './core/interceptors/global-progress.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withInterceptors([globalProgressInterceptor])),
    provideEchartsCore({ echarts }),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: 'html.dark-mode',
        },
      },
    }),
    provideAppInitializer(() => inject(AuthService).loadCurrentUser()),
  ],
};
