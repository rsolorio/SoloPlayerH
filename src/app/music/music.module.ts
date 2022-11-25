import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtistListComponent } from './artist-list/artist-list.component';
import { CoreModule } from '../core/core.module';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { AlbumListComponent } from './album-list/album-list.component';
import { ClassificationListComponent } from './classification-list/classification-list.component';
import { SongListComponent } from './song-list/song-list.component';
import { MusicBreadcrumbsComponent } from './music-breadcrumbs/music-breadcrumbs.component';
import { PlaylistListComponent } from './playlist-list/playlist-list.component';

@NgModule({
  declarations: [
    ArtistListComponent,
    AlbumListComponent,
    ClassificationListComponent,
    SongListComponent,
    MusicBreadcrumbsComponent,
    PlaylistListComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    SharedModule
  ],
  entryComponents: []
})
export class MusicModule { }
