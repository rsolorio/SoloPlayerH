import { Component, OnInit, ViewChild } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { IArtistModel } from 'src/app/shared/models/artist-model.interface';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { ArtistListBroadcastService } from './artist-list-broadcast.service';

@Component({
  selector: 'sp-artist-list',
  templateUrl: './artist-list.component.html',
  styleUrls: ['./artist-list.component.scss']
})
export class ArtistListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public appEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];
  public isAlbumArtist = false;

  constructor(
    public broadcastService: ArtistListBroadcastService,
    private utility: UtilityService,
    private breadcrumbsService: BreadcrumbsStateService,
    private db: DatabaseService
  ) {
    super();
    this.isAlbumArtist = this.utility.isRouteActive(AppRoutes.AlbumArtists);
    this.broadcastService.isAlbumArtist = this.isAlbumArtist;
  }

  ngOnInit(): void {
    this.initializeItemMenu();
    this.removeUnsupportedBreadcrumbs();
  }

  private initializeItemMenu(): void {
    this.itemMenuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.itemMenuList.push({
      caption: 'Select/Unselect',
      icon: 'mdi-select mdi',
      action: param => {
        const artist = param as IArtistModel;
        artist.selected = !artist.selected;
      }
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
    const criteria: ICriteriaValueBaseModel[] = [];
    const columnName = this.isAlbumArtist ? 'primaryArtistId' : 'artistId';
    const criteriaValue = new CriteriaValueBase(columnName, artist.id);
    criteriaValue.DisplayName = this.db.displayName(criteriaValue.ColumnName);
    criteriaValue.DisplayValue = artist.artistStylized;
    if (columnName === 'artistId') {
      // This column needs to be ignored in order to prevent duplicate search results
      criteriaValue.IgnoreInSelect = true;
    }
    criteria.push(criteriaValue);

    const selectedItems = this.spListBaseComponent.getSelectedItems();
    if (selectedItems.length) {
      for (const item of selectedItems) {
        const artistItem = item as IArtistModel;
        const criteriaItem = new CriteriaValueBase(columnName, artistItem.id);
        criteriaItem.DisplayName = criteriaValue.DisplayName;
        criteriaItem.DisplayValue = artistItem.name;
        if (columnName === 'artistId') {
          criteriaItem.IgnoreInSelect = true;
        }
        criteria.push(criteriaItem);
      }
    }
    // Suppress event so this component doesn't react to this change;
    // these breadcrumbs are for another list that hasn't been loaded yet
    this.breadcrumbsService.addOne({
      criteriaList: criteria,
      origin: this.isAlbumArtist ? BreadcrumbSource.AlbumArtist : BreadcrumbSource.Artist
    }, { suppressEvents: true });
  }

  public onListInitialized(): void {
  }

  private removeUnsupportedBreadcrumbs(): void {
    const breadcrumbs = this.breadcrumbsService.getState();
    if (this.isAlbumArtist) {
      let unsupportedBreadcrumbs = breadcrumbs.filter(breadcrumb =>
        breadcrumb.origin === BreadcrumbSource.Album ||
        breadcrumb.origin === BreadcrumbSource.AlbumArtist ||
        breadcrumb.origin === BreadcrumbSource.Artist);
      
      for (const breadcrumb of unsupportedBreadcrumbs) {
        this.breadcrumbsService.remove(breadcrumb.sequence);
      }
    }
    else {
      // Artist does not support any kind of breadcrumbs
      this.breadcrumbsService.clear();
    }
  }
}
