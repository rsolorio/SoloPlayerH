import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IArtistModel } from 'src/app/shared/models/artist-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { ArtistListBroadcastService } from './artist-list-broadcast.service';

@Component({
  selector: 'sp-artist-list',
  templateUrl: './artist-list.component.html',
  styleUrls: ['./artist-list.component.scss']
})
export class ArtistListComponent extends CoreComponent implements OnInit {

  public appEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];
  public isAlbumArtist = false;

  constructor(
    private broadcastService: ArtistListBroadcastService,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService
  ) {
    super();
    this.isAlbumArtist = this.utility.isRouteActive(AppRoutes.AlbumArtists);
  }

  ngOnInit(): void {
    this.initializeItemMenu();
  }

  private initializeItemMenu(): void {
    this.itemMenuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.itemMenuList.push({
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const artistModel = param as IArtistModel;
        this.utility.googleSearch(artistModel.name);
      }
    });

    this.itemMenuList.push({
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

  public onSearch(searchTerm: string): void {
    console.log(searchTerm);
  }

  public onFavoriteClick(): void {}

  public onItemContentClick(): void {}

  public onInitialized(): void {
    this.loadingService.show();
    const pagination: IPaginationModel<IArtistModel> = {
      items: [],
      criteria: null,
      name: null
    };

    if (this.isAlbumArtist) {
      this.broadcastService.getAndBroadcastAlbumArtists(pagination).subscribe();
    }
    else {
      this.broadcastService.getAndBroadcast(pagination).subscribe();
    }
  }

}
