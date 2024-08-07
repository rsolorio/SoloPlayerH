import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtistListComponent } from './artist-list/artist-list.component';
import { CoreModule } from '../core/core.module';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { AlbumListComponent } from './album-list/album-list.component';
import { ClassificationListComponent } from './classification-list/classification-list.component';
import { SongListComponent } from './song-list/song-list.component';
import { ListTransformService } from '../shared/services/list-transform/list-transform.service';
import { SongValidatorFactory } from './transform-validators/song-validator-factory';
import { ValueListModule } from '../value-list/value-list.module';
import { ArtistViewComponent } from './artist-view/artist-view.component';
import { RouterModule } from '@angular/router';
import { SongViewComponent } from './song-view/song-view.component';
import { FileService } from '../platform/file/file.service';
import { FileElectronService } from '../platform/file/file-electron.service';
import { FileCordovaService } from '../platform/file/file-cordova.service';
import { AlbumViewComponent } from './album-view/album-view.component';

@NgModule({
  declarations: [
    ArtistListComponent,
    AlbumListComponent,
    ClassificationListComponent,
    SongListComponent,
    ArtistViewComponent,
    SongViewComponent,
    AlbumViewComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    SharedModule,
    ValueListModule,
    RouterModule.forChild([
      {
        path: 'artists/:id', component: ArtistViewComponent
      },
      {
        path: 'songs/:id', component: SongViewComponent
      },
      {
        path: 'albums/:id', component: AlbumViewComponent
      }
    ])
  ],
  entryComponents: [],
  providers: [ { provide: FileService, useClass: FileElectronService }]
})
export class MusicModule {
  constructor(transformService: ListTransformService) {
    transformService.register(new SongValidatorFactory());
  }
}
