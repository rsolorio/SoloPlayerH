import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { ITrackListModel } from './track-list.interface';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';
import { PlayerSongStatus } from 'src/app/shared/models/player.enum';

@Component({
  selector: 'sp-track-list',
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.scss']
})
export class TrackListComponent extends CoreComponent implements OnInit {
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
      icon: 'mdi-account-badge mdi'
    });
    this.model.itemMenuList.push({
      caption: 'Go To Album',
      icon: 'mdi-album mdi'
    });
    this.model.itemMenuList.push({
      isSeparator: true,
      caption: ''
    });
    if (this.model.editEnabled) {
      this.model.itemMenuList.push({
        caption: 'Move Up',
        icon: 'mdi-arrow-up mdi'
      });
      this.model.itemMenuList.push({
        caption: 'Move Down',
        icon: 'mdi-arrow-down mdi'
      });
      this.model.itemMenuList.push({
        caption: 'Move To Top',
        icon: 'mdi-arrow-collapse-up mdi'
      });
      this.model.itemMenuList.push({
        caption: 'Move To Bottom',
        icon: 'mdi-arrow-collapse-down mdi'
      });
    }
    this.model.itemMenuList.push({
      caption: 'Remove',
      icon: 'mdi-delete-outline mdi'
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
