import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { AlbumArtistViewEntity, ArtistClassificationViewEntity, ArtistViewEntity } from 'src/app/shared/entities';
import { IArtistModel } from 'src/app/shared/models/artist-model.interface';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { Criteria, CriteriaItem, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison } from 'src/app/shared/services/criteria/criteria.enum';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class ArtistListBroadcastService extends ListBroadcastServiceBase<IArtistModel> {

  public isAlbumArtist = false;
  constructor(
    private events: EventsService,
    private utilities: UtilityService,
    private db: DatabaseService,
    private breadcrumbs: BreadcrumbsStateService)
  {
    super(events, utilities, breadcrumbs);
  }

  protected getEventName(): string {
    return AppEvent.ArtistListUpdated;
  }

  protected buildSearchCriteria(searchTerm: string): CriteriaItems {
    const result = new CriteriaItems();
    if (searchTerm) {
      const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);
      const criteriaItem = new CriteriaItem('name', criteriaSearchTerm, CriteriaComparison.Like);
      result.push(criteriaItem);
    }
    return result;
  }

  protected buildSystemCriteria(): CriteriaItems {
    const result = new CriteriaItems();
    result.push(new CriteriaItem('songCount', 0, CriteriaComparison.GreaterThan));
    return result;
  }

  protected addSortingCriteria(criteria: Criteria): void {
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
    if (this.isAlbumArtist) {
      // Album Artists support Genre and Classification breadcrumbs
      let unsupportedBreadcrumbs = allBreadcrumbs.filter(breadcrumb =>
        breadcrumb.origin !== BreadcrumbSource.Genre &&
        breadcrumb.origin !== BreadcrumbSource.Classification);
      
      for (const breadcrumb of unsupportedBreadcrumbs) {
        this.breadcrumbs.remove(breadcrumb.sequence);
      }
    }
    else {
      // Artists do not support any kind of breadcrumbs
      this.breadcrumbs.clear();
    }
  }

  protected getItems(criteria: Criteria): Observable<IArtistModel[]> {
    if (this.isAlbumArtist) {
      if (criteria.hasComparison(false, 'classificationId')) {
        return from(this.db.getList(ArtistClassificationViewEntity, criteria));
      }
      return from(this.db.getList(AlbumArtistViewEntity, criteria));
    }
    return from(this.db.getList(ArtistViewEntity, criteria));
  }
}
