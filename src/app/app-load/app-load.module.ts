import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppInitService } from './app-init/app-init.service';

export function initApp(appInitService: AppInitService): () => Promise<void> {
  return () => appInitService.initialize();
}

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    AppInitService,
    { provide: APP_INITIALIZER, useFactory: initApp, deps: [AppInitService], multi: true },
  ]
})
export class AppLoadModule { }
