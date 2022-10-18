import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
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
    private broadcastService: ArtistListBroadcastService,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService
  ) {
    super();
    this.isAlbumArtist = this.utility.isRouteActive(AppRoutes.AlbumArtists);
  }

  ngOnInit(): void {
    this.loadingService.show();
    this.initializeMenu();

    this.subs.sink = this.events.onEvent<IPaginationModel<IArtistModel>>(AppEvent.ArtistListUpdated).subscribe(response => {
      this.model = response;
      this.loadingService.hide();
    });

    const pagination: IPaginationModel<IArtistModel> = {
      items: [],
      criteria: null,
      name: null
    };
    // Use broadcast to search and populate
    if (this.isAlbumArtist) {
      this.broadcastService.getAndBroadcastAlbumArtists(pagination).subscribe();
    }
    else {
      this.broadcastService.getAndBroadcast(pagination).subscribe();
    }
  }

  private initializeMenu(): void {
    this.menuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.menuList.push({
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const artistModel = param as IArtistModel;
        this.utility.googleSearch(artistModel.name);
      }
    });

    this.menuList.push({
      caption: 'Properties...',
      icon: 'mdi-square-edit-outline mdi',
      action: param => {
        const artist = param as IArtistModel;
        if (artist) {
          this.utility.navigateWithRouteParams(AppRoutes.Artists, [artist.id]);
        }
      }
    });
  }

  public onArtistClick(): void {}

  public onIntersectionChange(isIntersecting: boolean, artist: IArtistModel): void {
    // console.log(isIntersecting);
    // console.log(artist);

    artist.canBeRendered = isIntersecting;
    if (isIntersecting && !artist.imageSrc) {
      // TODO: logic for getting artist image
      artist.imageSrc = '../assets/img/default-image-small.jpg';
    }
  }

}
