import { Component, OnInit } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { EventsService } from 'src/app/core/services/events/events.service';
import { ArtistEntity } from 'src/app/shared/entities';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { ArtistListBroadcastService } from './artist-list-broadcast.service';
import { ArtistListStateService } from './artist-list-state.service';

@Component({
  selector: 'sp-artist-list',
  templateUrl: './artist-list.component.html',
  styleUrls: ['./artist-list.component.scss']
})
export class ArtistListComponent extends CoreComponent implements OnInit {

  public model: IPaginationModel<ArtistEntity> = {
    items: []
  };

  constructor(
    private stateService: ArtistListStateService,
    private events: EventsService,
    private broadcast: ArtistListBroadcastService
  ) {
    super();
  }

  ngOnInit(): void {
    // this.model = this.stateService.getState();

    this.subs.sink = this.events.onEvent<IPaginationModel<ArtistEntity>>(AppEvent.ArtistListUpdated).subscribe(response => {
      this.model = response;
    });

    const pagination: IPaginationModel<ArtistEntity> = {
      items: [],
      criteria: null,
      name: null
    };
    // Use broadcast to search and populate
    this.broadcast.getAndBroadcast(pagination).subscribe();
  }

  private initializeMenu(): void {
  }

  public onArtistClick(): void {}

  public getArtistGroupName(): void {}

  public getArtistGenderIcons(): void {}

  public onFavoriteChange(): void {}

}
