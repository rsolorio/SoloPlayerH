import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IArtistModel } from 'src/app/shared/models/artist-model.interface';
import { CriteriaOperator } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { BreadcrumbSource, IMusicBreadcrumbModel } from 'src/app/shared/models/music-breadcrumb-model.interface';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { SearchWildcard } from 'src/app/shared/models/search.enum';
import { MusicBreadcrumbsStateService } from '../music-breadcrumbs/music-breadcrumbs-state.service';
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
    private loadingService: LoadingViewStateService,
    private breadcrumbsService: MusicBreadcrumbsStateService
  ) {
    super();
    this.isAlbumArtist = this.utility.isRouteActive(AppRoutes.AlbumArtists);
    this.broadcastService.isAlbumArtist = this.isAlbumArtist;
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

    this.itemMenuList.push({
      isSeparator: true,
      caption: null
    });

    if (this.isAlbumArtist) {
      this.itemMenuList.push({
        caption: 'Albums',
        icon: 'mdi-album mdi',
        action: param => {
          const artist = param as IArtistModel;
          if (artist) {
            this.showAlbums(artist);
          }
        }
      });
    }

    this.itemMenuList.push({
      caption: 'Songs',
      icon: 'mdi-music-note mdi',
      action: param => {
        const artist = param as IArtistModel;
          if (artist) {
            this.showSongs(artist);
          }
      }
    });
  }

  public onSearch(searchTerm: string): void {
    this.loadingService.show();
    this.broadcastService.search(searchTerm).subscribe();
  }

  public onItemContentClick(artist: IArtistModel): void {
    this.onArtistClick(artist);
  }

  private onArtistClick(artist: IArtistModel): void {
    if (this.isAlbumArtist) {
      this.showAlbums(artist);
    }
    else {
      this.showSongs(artist);
    }
  }

  private showAlbums(artist: IArtistModel): void {
    this.addBreadcrumb(artist);
    this.utility.navigate(AppRoutes.Albums);
  }

  private showSongs(artist: IArtistModel): void {
    this.addBreadcrumb(artist);
    this.utility.navigate(AppRoutes.Songs);
  }

  private addBreadcrumb(artist: IArtistModel): void {
    const columnName = this.isAlbumArtist ? 'primaryArtistId' : 'artistId';
    const criteriaItem = new CriteriaValueBase(columnName, artist.id, CriteriaOperator.Equals);
    this.breadcrumbsService.add({
      caption: artist.name,
      criteriaList: [ criteriaItem ],
      source: this.isAlbumArtist ? BreadcrumbSource.AlbumArtist : BreadcrumbSource.Artist
    });
  }

  public onListInitialized(): void {
    const breadcrumbs = this.breadcrumbsService.getState();
    if (breadcrumbs.length) {
      this.loadArtists(breadcrumbs);
    }
    else {
      this.loadAllArtists();
    }
  }

  private loadAllArtists(): void {
    this.loadingService.show();
    this.broadcastService.search(SearchWildcard.All).subscribe();
  }

  private loadArtists(breadcrumbs: IMusicBreadcrumbModel[]): void {
    this.loadingService.show();
    const listModel: IPaginationModel<IArtistModel> = {
      items: [],
      criteria: []
    };
    for (const breadcrumb of breadcrumbs) {
      for (const criteriaItem of breadcrumb.criteriaList) {
        listModel.criteria.push(criteriaItem);
      }
    }
    this.broadcastService.getAndBroadcast(listModel).subscribe();
  }
}
