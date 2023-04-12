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

/*
This is the component hierarchy of the application:

- AppComponent
  - LoadingView
  - SideBar (Left)
    - SideBarMenu
  - SideBar (Right) [Dynamic Content]
    - ImagePreview
    - ChipSelection
    - ValueListSelector
  - NavBar [Dynamic Content]
    - Breadcrumbs
    - QuickSearch
  - Router Outlet
    - FilterView
    - HomeView
    - LogView
    - AlbumList
      - TransitionImage
      - IntersectionObserver
    - ArtistList
      - TransitionImage
      - IntersectionObserver
    - ClassificationList
      - TransitionImage
      - IntersectionObserver
    - PlaylistList
      - TransitionImage
      - IntersectionObserver
    - SongList
      - TransitionImage
      - IntersectionObserver
      - IconMenu
    - FileBrowser
    - SettingsView
    - QueryEditor
  - PlayerOverlay
    - PlayerSmall
    - PlayerFull
      - Rating
      - TextScroller
      - ResizeObserver
*/