import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtistListComponent } from './artist-list/artist-list.component';
import { CoreModule } from '../core/core.module';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { AlbumListComponent } from './album-list/album-list.component';
import { ClassificationListComponent } from './classification-list/classification-list.component';
import { SongListComponent } from './song-list/song-list.component';
import { PlaylistListComponent } from './playlist-list/playlist-list.component';
import { FileService } from '../shared/services/file/file.service';
import { FileNodeService } from '../shared/services/file/file-node.service';
import { FileCordovaService } from '../shared/services/file/file-cordova.service';
import { ListTransformService } from '../shared/services/list-transform/list-transform.service';
import { SongValidatorFactory } from './transform-validators/song-validator-factory';

@NgModule({
  declarations: [
    ArtistListComponent,
    AlbumListComponent,
    ClassificationListComponent,
    SongListComponent,
    PlaylistListComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    SharedModule
  ],
  entryComponents: [],
  providers: [ { provide: FileService, useClass: FileNodeService }]
})
export class MusicModule {
  constructor(transformService: ListTransformService) {
    transformService.register(new SongValidatorFactory());
  }
}
