import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IArtistModel } from 'src/app/shared/models/artist-model.interface';
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

  public model: IPaginationModel<IArtistModel> = {
    items: []
  };
  /** This is the menu of each artist item */
  public menuList: IMenuModel[] = [];

  public isAlbumArtist = false;

  constructor(
    private stateService: ArtistListStateService,
    private events: EventsService,
    private broadcast: ArtistListBroadcastService,
    private utility: UtilityService
  ) {
    super();
    this.isAlbumArtist = this.utility.isRouteActive(AppRoutes.AlbumArtists);
  }

  ngOnInit(): void {
    // this.model = this.stateService.getState();

    this.subs.sink = this.events.onEvent<IPaginationModel<IArtistModel>>(AppEvent.ArtistListUpdated).subscribe(response => {
      console.log(response.items[0]);
      this.model = response;
    });

    const pagination: IPaginationModel<IArtistModel> = {
      items: [],
      criteria: null,
      name: null
    };
    // Use broadcast to search and populate
    this.broadcast.getAndBroadcastAlbumArtists(pagination).subscribe();
  }

  private initializeMenu(): void {
  }

  public onArtistClick(): void {}

  public getArtistGroupName(): void {}

  public getArtistGenderIcons(): void {}

  public onFavoriteChange(): void {}

}
