import { Injectable } from '@angular/core';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { IAddToPlaylistModel } from './add-to-playlist.interface';
import { AddToPlaylistComponent } from './add-to-playlist.component';
import { AppActionIcons, AppAttributeIcons } from 'src/app/app-icons';

@Injectable({
  providedIn: 'root'
})
export class AddToPlaylistService {
  constructor(private sidebarHostService: SideBarHostStateService) { }

  public showPanel(songs: ISongModel[]): void {
    const model: IAddToPlaylistModel = {
      componentType: AddToPlaylistComponent,
      songs: songs,
      title: 'Add To Playlist',
      titleIcon: AppActionIcons.AddToPlaylist,
      subTitle: songs[0].name,
      subTitleIcon: AppAttributeIcons.SongName
    };
    this.sidebarHostService.loadContent(model);
  }
}
