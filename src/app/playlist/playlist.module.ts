import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaylistListComponent } from './playlist-list/playlist-list.component';
import { PlaylistSongListComponent } from './playlist-song-list/playlist-song-list.component';
import { CoreModule } from '../core/core.module';
import { FormsModule } from '@angular/forms';
import { ValueListModule } from '../value-list/value-list.module';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [
    PlaylistListComponent,
    PlaylistSongListComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    SharedModule
  ]
})
export class PlaylistModule { }
