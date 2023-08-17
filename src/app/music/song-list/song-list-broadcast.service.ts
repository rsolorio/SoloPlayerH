import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { SongArtistViewEntity, SongViewEntity,SongClassificationViewEntity } from 'src/app/shared/entities';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { IMusicSearchTerms } from 'src/app/shared/models/music-model.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { Criteria, CriteriaItem, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison, CriteriaJoinOperator } from 'src/app/shared/services/criteria/criteria.enum';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class SongListBroadcastService extends ListBroadcastServiceBase<ISongModel> {

  constructor(
    private events: EventsService,
    private options: DatabaseOptionsService,
    private db: DatabaseService,
    private breadcrumbs: BreadcrumbsStateService)
  {
    super(events, options, breadcrumbs);
  }

  protected getEventName(): string {
    return AppEvent.SongListUpdated;
  }

  protected buildSearchCriteria(searchTerm: string): CriteriaItems {
    const musicSearch = this.buildSearchTerms(searchTerm);
    return this.buildCriteriaFromTerms(musicSearch);
  }

  protected addSortingCriteria(criteria: Criteria): void {
    if (criteria.hasComparison(false, 'primaryArtistId') || criteria.hasComparison(false, 'artistId') || criteria.hasComparison(false, 'primaryAlbumId')) {
      // First sort by year in case there are multiple albums with the same name for the same artist
      criteria.addSorting('releaseYear');
      // Album Name in case multiple albums in the same year
      criteria.addSorting('primaryAlbumName');
      // Now sort by album media
      criteria.addSorting('mediaNumber');
      // Then by album track
      criteria.addSorting('trackNumber');
    }
    // In case tracks don't have numbers, sort by title
    criteria.addSorting('name');
  }

  protected getItems(criteria: Criteria): Observable<ISongModel[]> {
    if (criteria.hasComparison(false, 'artistId')) {
      return from(this.db.getList(SongArtistViewEntity, criteria));
    }
    if (criteria.hasComparison(false, 'classificationId')) {
      return from(this.db.getList(SongClassificationViewEntity, criteria));
    }
    return from(this.db.getList(SongViewEntity, criteria));
  }

  /**
   * Gets an object that defines the search terms for specific artists, albums, titles, or just generic values.
   */
  private buildSearchTerms(searchTerm: string): IMusicSearchTerms {
    const musicSearch: IMusicSearchTerms = {
      artists: [],
      albums: [],
      titles: [],
      wildcard: ''
    };

    if (!searchTerm) {
      return musicSearch;
    }

    let artist = '';
    let album = '';
    let title = '';

    // SEARCH SYNTAX
    // Artist: @artistName, @"artist name"
    // Album: $albumName, $"album name"
    // Title: #songTitle, #"song title"
    // TODO: implement reg exp

    const searchItems = searchTerm.split(' ');
    searchItems.forEach(searchItem => {
      if (searchItem.startsWith('@')) {
        if (searchItem.startsWith('@"')) {
          artist = searchItem.substring(2);
          if (artist.endsWith('"')) {
            artist = artist.substring(0, artist.length - 1);
            musicSearch.artists.push(artist);
          }
        }
        else {
          musicSearch.artists.push(searchItem.substring(1));
        }
      } else if (searchItem.startsWith('$')) {
        if (searchItem.startsWith('$"')) {
          album = searchItem.substring(2);
          if (album.endsWith('"')) {
            album = album.substring(0, album.length - 1);
            musicSearch.albums.push(album);
          }
        }
        else {
          musicSearch.albums.push(searchItem.substring(1));
        }
      }
      else if (searchItem.startsWith('#')) {
        if (searchItem.startsWith('#"')) {
          title = searchItem.substring(2);
          if (title.endsWith('"')) {
            title = title.substring(0, title.length - 1);
            musicSearch.titles.push(title);
          }
        }
        else {
          musicSearch.titles.push(searchItem.substring(1));
        }
      }
      else {
        if (artist) {
          if (searchItem.endsWith('"')) {
            artist += ' ' + searchItem.substring(0, searchItem.length - 1);
            musicSearch.artists.push(artist);
            artist = null;
          }
          else {
            artist += ' ' + searchItem;
          }
        }
        else if (album) {
          if (searchItem.endsWith('"')) {
            album += ' ' + searchItem.substring(0, searchItem.length - 1);
            musicSearch.albums.push(album);
            album = null;
          }
          else {
            album += ' ' + searchItem;
          }
        }
        else if (title) {
          if (searchItem.endsWith('"')) {
            title += ' ' + searchItem.substring(0, searchItem.length - 1);
            musicSearch.titles.push(title);
            title = null;
          }
          else {
            title += ' ' + searchItem;
          }
        }
        else {
          musicSearch.wildcard += searchItem + ' ';
        }
      }
    });

    return musicSearch;
  }

  private buildCriteriaFromTerms(searchTerms: IMusicSearchTerms): CriteriaItems {
    if (!searchTerms.artists.length && !searchTerms.albums.length && !searchTerms.titles.length) {
      return this.buildArtistAlbumTitleCriteria(searchTerms.wildcard);
    }

    const criteriaItems = new CriteriaItems();

    searchTerms.artists.forEach(artist => {
      const searchTerm = this.normalizeCriteriaSearchTerm(artist, true);
      const criteriaItem = new CriteriaItem('primaryArtistName', searchTerm, CriteriaComparison.Like);
      criteriaItems.push(criteriaItem);
    });

    searchTerms.albums.forEach(album => {
      const searchTerm = this.normalizeCriteriaSearchTerm(album, true);
      const criteriaItem = new CriteriaItem('primaryAlbumName', searchTerm, CriteriaComparison.Like);
      criteriaItems.push(criteriaItem);
    });

    searchTerms.titles.forEach(title => {
      const searchTerm = this.normalizeCriteriaSearchTerm(title, true);
      const criteriaItem = new CriteriaItem('name', searchTerm, CriteriaComparison.Like);
      criteriaItems.push(criteriaItem);
    });
    // TODO: what to do with wildcards here?

    return criteriaItems;
  }

  private buildArtistAlbumTitleCriteria(searchTerm: string): CriteriaItems {
    const criteriaItems = new CriteriaItems();
    if (!searchTerm) {
      return criteriaItems;
    }
    const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);

    let criteriaItem = new CriteriaItem('primaryArtistName', criteriaSearchTerm, CriteriaComparison.Like);
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItems.push(criteriaItem);

    criteriaItem = new CriteriaItem('primaryAlbumName', criteriaSearchTerm, CriteriaComparison.Like);
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItems.push(criteriaItem);

    criteriaItem = new CriteriaItem('name', criteriaSearchTerm, CriteriaComparison.Like);
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItems.push(criteriaItem);

    return criteriaItems;
  }
}
