import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { SongArtistViewEntity, SongViewEntity,SongClassificationViewEntity } from 'src/app/shared/entities';
import { CriteriaOperator, CriteriaSortDirection, ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { IMusicSearchTerms } from 'src/app/shared/models/music-model.interface';
import { QueryModel } from 'src/app/shared/models/query-model.class';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class SongListBroadcastService extends ListBroadcastServiceBase<ISongModel> {

  constructor(
    private eventsService: EventsService,
    private utilityService: UtilityService,
    private db: DatabaseService)
  {
    super(eventsService, utilityService);
  }

  protected getEventName(): string {
    return AppEvent.SongListUpdated;
  }

  protected buildSearchCriteria(searchTerm: string): ICriteriaValueBaseModel[] {
    const musicSearch = this.buildSearchTerms(searchTerm);
    return this.buildCriteriaFromTerms(musicSearch);
  }

  protected addSortingCriteria(queryModel: QueryModel<ISongModel>): void {
    if (queryModel.hasCriteria('primaryArtistId') || queryModel.hasCriteria('artistId') || queryModel.hasCriteria('primaryAlbumId')) {
      // First sort by year in case there are multiple albums with the same name for the same artist
      queryModel.addSorting('releaseYear', CriteriaSortDirection.Ascending);
      // Album Name in case multiple albums in the same year
      queryModel.addSorting('primaryAlbumName', CriteriaSortDirection.Ascending);
      // Now sort by album media
      queryModel.addSorting('mediaNumber', CriteriaSortDirection.Ascending);
      // Then by album track
      queryModel.addSorting('trackNumber', CriteriaSortDirection.Ascending);
    }
    // In case tracks don't have numbers, sort by title
    queryModel.addSorting('name', CriteriaSortDirection.Ascending);
  }

  protected getItems(queryModel: QueryModel<ISongModel>): Observable<ISongModel[]> {
    if (queryModel.hasCriteria('artistId')) {
      return from(this.db.getList(SongArtistViewEntity, queryModel));
    }
    if (queryModel.hasCriteria('classificationId')) {
      return from(this.db.getList(SongClassificationViewEntity, queryModel));
    }
    return from(this.db.getList(SongViewEntity, queryModel));
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

  private buildCriteriaFromTerms(searchTerms: IMusicSearchTerms): ICriteriaValueBaseModel[] {
    if (!searchTerms.artists.length && !searchTerms.albums.length && !searchTerms.titles.length) {
      return this.buildArtistAlbumTitleCriteria(searchTerms.wildcard);
    }

    const criteria: ICriteriaValueBaseModel[] = [];

    searchTerms.artists.forEach(artist => {
      const searchTerm = this.normalizeCriteriaSearchTerm(artist, true);
      const criteriaValue = new CriteriaValueBase('primaryArtistName', searchTerm, CriteriaOperator.Like);
      criteria.push(criteriaValue);
    });

    searchTerms.albums.forEach(album => {
      const searchTerm = this.normalizeCriteriaSearchTerm(album, true);
      const criteriaValue = new CriteriaValueBase('primaryAlbumName', searchTerm, CriteriaOperator.Like);
      criteria.push(criteriaValue);
    });

    searchTerms.titles.forEach(title => {
      const searchTerm = this.normalizeCriteriaSearchTerm(title, true);
      const criteriaValue = new CriteriaValueBase('name', searchTerm, CriteriaOperator.Like);
      criteria.push(criteriaValue);
    });
    // TODO: what to do with wildcards here?

    return criteria;
  }

  private buildArtistAlbumTitleCriteria(searchTerm: string): ICriteriaValueBaseModel[] {
    const criteria: ICriteriaValueBaseModel[] = [];
    if (!searchTerm) {
      return criteria;
    }
    const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);

    let criteriaValue = new CriteriaValueBase('primaryArtistName', criteriaSearchTerm, CriteriaOperator.Like);
    criteriaValue.OrOperator = true;
    criteria.push(criteriaValue);

    criteriaValue = new CriteriaValueBase('primaryAlbumName', criteriaSearchTerm, CriteriaOperator.Like);
    criteriaValue.OrOperator = true;
    criteria.push(criteriaValue);

    criteriaValue = new CriteriaValueBase('name', criteriaSearchTerm, CriteriaOperator.Like);
    criteriaValue.OrOperator = true;
    criteria.push(criteriaValue);

    return criteria;
  }
}
