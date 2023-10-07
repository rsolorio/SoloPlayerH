import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { IFileBrowserItem } from './file-browser.interface';
import { Observable } from 'rxjs';
import { Criteria, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { FileService } from '../file/file.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { AppEvent } from 'src/app/app-events';

@Injectable({
  providedIn: 'root'
})
export class FileBrowserBroadcastService extends ListBroadcastServiceBase<IFileBrowserItem> {

  constructor(
    private events: EventsService,
    private options: DatabaseOptionsService,
    private breadcrumbs: BreadcrumbsStateService,
    private navigation: NavigationService,
    private fileService: FileService)
  {
    super(events, options, breadcrumbs);
  }

  protected getEventName(): string {
    return AppEvent.FileListUpdated;
  }

  protected getItems(criteria: Criteria): Observable<IFileBrowserItem[]> {
    return new Observable<IFileBrowserItem[]>(observer => {
      const currentNavigation = this.navigation.current();
      let directoryPath = '';
      if (currentNavigation.options?.queryParams?.path) {
        directoryPath = currentNavigation.options.queryParams.path;
      }
      this.fileService.getDirectories(directoryPath).then(async items => {
        const result: IFileBrowserItem[] = [];
        for (const fileInfo of items) {
          if (!fileInfo.hasError) {
            result.push({
              fileInfo: fileInfo,
              id: fileInfo.path,
              name: fileInfo.name,
              canBeRendered: false
            });
          }
        }
        observer.next(result);
        observer.complete();
      });
    });
  }

  protected buildSearchCriteria(searchTerm: string): CriteriaItems {
    return null;
  }
}
