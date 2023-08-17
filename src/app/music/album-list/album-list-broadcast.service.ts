import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { AlbumViewEntity, AlbumClassificationViewEntity } from 'src/app/shared/entities';
import { IAlbumModel } from 'src/app/shared/models/album-model.interface';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { Criteria, CriteriaItem, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison } from 'src/app/shared/services/criteria/criteria.enum';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class AlbumListBroadcastService extends ListBroadcastServiceBase<IAlbumModel> {

  constructor(
    private events: EventsService,
    private options: DatabaseOptionsService,
    private db: DatabaseService,
    private breadcrumbs: BreadcrumbsStateService)
  {
    super(events, options, breadcrumbs);
  }

  protected getEventName(): string {
    return AppEvent.AlbumListUpdated;
  }

  protected buildSearchCriteria(searchTerm: string): CriteriaItems {
    const result = new CriteriaItems();
    if (searchTerm) {
      const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);
      const criteriaItem = new CriteriaItem('name', criteriaSearchTerm, CriteriaComparison.Like);
      result.push(criteriaItem);
    }
    // TODO: sort by LastSongAddDate
    return result;
  }

  protected buildSystemCriteria(): CriteriaItems {
    const result = new CriteriaItems();
    result.push(new CriteriaItem('songCount', 0, CriteriaComparison.GreaterThan));
    // result.push(new CriteriaItem('name', 'Unknown', CriteriaComparison.NotEquals));
    return result;
  }

  protected addSortingCriteria(criteria: Criteria): void {
    // When displaying albums of a particular artist, we want the albums to be sorted by release year
    if (criteria.hasComparison(false, 'primaryArtistId') || criteria.hasComparison(false, 'artistId')) {
      criteria.addSorting('releaseYear');
    }
    criteria.addSorting('name');
  }

  protected beforeGetItems(criteria: Criteria): void {
    this.removeUnsupportedBreadcrumbs();
    super.beforeGetItems(criteria);
  }

  private removeUnsupportedBreadcrumbs(): void {
    if (!this.breadcrumbs.hasBreadcrumbs()) {
      return;
    }
    const allBreadcrumbs = this.breadcrumbs.getState().items;
    const unsupportedBreadcrumbs = allBreadcrumbs.filter(breadcrumb =>
      breadcrumb.origin !== BreadcrumbSource.Classification &&
      breadcrumb.origin !== BreadcrumbSource.Genre &&
      breadcrumb.origin !== BreadcrumbSource.AlbumArtist);
    for (const breadcrumb of unsupportedBreadcrumbs) {
      // Do we need to suppress events?
      this.breadcrumbs.remove(breadcrumb.sequence);
    }
  }

  protected getItems(criteria: Criteria): Observable<IAlbumModel[]> {
    if (criteria.hasComparison(false, 'classificationId')) {
      return from(this.db.getList(AlbumClassificationViewEntity, criteria));
    }
    return from(this.db.getList(AlbumViewEntity, criteria));
  }
}
