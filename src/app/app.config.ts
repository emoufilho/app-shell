import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { ImportMapService } from './services/import-map.service';
import { RemoteRegistryService } from './services/remote-registry.service';
import { RemoteLoaderService } from './services/remote-loader.service';

function importMapInitializer(importMap: ImportMapService) {
  return () => importMap.load('/assets/import-map.dev.json');
}

function preloadCriticalInitializer(registry: RemoteRegistryService, loader: RemoteLoaderService) {
  return () => new Promise<void>((resolve) => {
    const run = () => registry.preloadCritical(loader).finally(() => resolve());
    // Usa requestIdleCallback se disponível para não impactar LCP
    (window as any).requestIdleCallback ? (window as any).requestIdleCallback(run) : setTimeout(run, 100);
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: importMapInitializer,
      deps: [ImportMapService],
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: preloadCriticalInitializer,
      deps: [RemoteRegistryService, RemoteLoaderService],
    }
  ]
};
