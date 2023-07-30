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

  ngOnInit(): void {
  }

  public onTrackClick(track: IPlaylistSongModel) {
    this.trackClick.emit(track);
  }
}
