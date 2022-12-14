import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeViewComponent } from './home/home-view/home-view.component';
import { LogViewComponent } from './log/log-view/log-view.component';
import { LogModule } from './log/log.module';
import { AlbumListComponent } from './music/album-list/album-list.component';
import { ArtistListComponent } from './music/artist-list/artist-list.component';
import { ClassificationListComponent } from './music/classification-list/classification-list.component';
import { MusicModule } from './music/music.module';
import { PlaylistListComponent } from './music/playlist-list/playlist-list.component';
import { SongListComponent } from './music/song-list/song-list.component';
import { SettingsViewComponent } from './settings/settings-view/settings-view.component';
import { SettingsModule } from './settings/settings.module';

const routes: Routes = [
  { path: 'home', component: HomeViewComponent },
  { path: 'settings', component: SettingsViewComponent },
  { path: 'artists', component: ArtistListComponent },
  { path: 'albumartists', component: ArtistListComponent },
  { path: 'albums', component: AlbumListComponent },
  { path: 'classifications', component: ClassificationListComponent },
  { path: 'genres', component: ClassificationListComponent },
  { path: 'songs', component: SongListComponent },
  { path: 'playlists', component: PlaylistListComponent },
  { path: 'log', component: LogViewComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
    MusicModule,
    SettingsModule,
    LogModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
