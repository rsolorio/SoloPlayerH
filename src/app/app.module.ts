import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { PlayerModule } from './player/player.module';
import { AppLoadModule } from './app-load/app-load.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppLoadModule,
    AppRoutingModule,
    CoreModule,
    PlayerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
