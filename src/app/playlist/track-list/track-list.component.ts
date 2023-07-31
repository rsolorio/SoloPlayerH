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
    items: []
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
