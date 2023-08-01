import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaylistListComponent } from './playlist-list/playlist-list.component';
import { PlaylistSongListComponent } from './playlist-song-list/playlist-song-list.component';
import { CoreModule } from '../core/core.module';
import { SharedModule } from '../shared/shared.module';
import { TrackListComponent } from './track-list/track-list.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AddToPlaylistComponent } from './add-to-playlist/add-to-playlist.component';



@NgModule({
  declarations: [
    PlaylistListComponent,
    PlaylistSongListComponent,
    TrackListComponent,
    AddToPlaylistComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild([
      {
        path: 'playlists/:id', component: PlaylistSongListComponent
      }
    ])
  ],
  exports: [ TrackListComponent ]
})
export class PlaylistModule { }
