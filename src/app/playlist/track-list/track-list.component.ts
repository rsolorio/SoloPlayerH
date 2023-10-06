import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { ITrackListModel } from './track-list.interface';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';
import { PlayerSongStatus } from 'src/app/shared/models/player.enum';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons, AppPlayerIcons } from 'src/app/app-icons';

/**
 * Base component that displays a list of tracks.
 */
@Component({
  selector: 'sp-track-list',
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.scss']
})
export class TrackListComponent extends CoreComponent implements OnInit {
  public AppActionIcons = AppActionIcons;
  public AppPlayerIcons = AppPlayerIcons;
  public AppAttributeIcons = AppAttributeIcons;
  public PlayerSongStatus = PlayerSongStatus;
  public model: ITrackListModel = {
    items: [],
    itemMenuList: []
  };
  @Output() public trackClick: EventEmitter<IPlaylistSongModel> = new EventEmitter();
  constructor() {
    super();
  }

  get items(): IPlaylistSongModel[] {
    return this.model.items;
  }
  @Input() set items(val: IPlaylistSongModel[]) {
    this.model.items = val;
  }

  get editEnabled(): boolean {
    return this.model.editEnabled;
  }
  @Input() set editEnabled(val: boolean) {
    this.model.editEnabled = val;
  }

  ngOnInit(): void {
    this.model.itemMenuList.push({
      caption: 'Go To Artist',
      icon: AppEntityIcons.Artist
    });
    this.model.itemMenuList.push({
      caption: 'Go To Album',
      icon: AppEntityIcons.Album
    });
    this.model.itemMenuList.push({
      isSeparator: true
    });
    if (this.model.editEnabled) {
      this.model.itemMenuList.push({
        caption: 'Move Up',
        icon: AppActionIcons.Up
      });
      this.model.itemMenuList.push({
        caption: 'Move Down',
        icon: AppActionIcons.Down
      });
      this.model.itemMenuList.push({
        caption: 'Move To Top',
        icon: AppAttributeIcons.Top
      });
      this.model.itemMenuList.push({
        caption: 'Move To Bottom',
        icon: AppAttributeIcons.Bottom
      });
    }
    this.model.itemMenuList.push({
      caption: 'Remove',
      icon: AppActionIcons.Delete
    });
  }

  public onTrackClick(track: IPlaylistSongModel) {
    this.trackClick.emit(track);
  }

  public onIntersectionChange(isIntersecting: boolean, item: IPlaylistSongModel): void {
    if (item.canBeRendered !== isIntersecting) {
      item.canBeRendered = isIntersecting;
    }
  }
}
