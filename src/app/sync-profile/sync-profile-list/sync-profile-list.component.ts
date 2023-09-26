import { Component, OnInit } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { SyncProfileEntity } from 'src/app/shared/entities';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { Criteria } from 'src/app/shared/services/criteria/criteria.class';
import { SyncProfileListBroadcastService } from './sync-profile-list-broadcast.service';
import { AppActionIcons, AppAttributeIcons } from 'src/app/app-icons';

@Component({
  selector: 'sp-sync-profile-list',
  templateUrl: './sync-profile-list.component.html',
  styleUrls: ['./sync-profile-list.component.scss']
})
export class SyncProfileListComponent extends CoreComponent implements OnInit {
  public AppActionIcons = AppActionIcons;
  public AppAttributeIcons = AppAttributeIcons;
  // START - LIST MODEL
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.SyncProfileListUpdated,
    itemMenuList: [
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    searchIconEnabled: true,
    breadcrumbsEnabled: true,
    broadcastService: this.broadcastService
  }
  // END - LIST MODEL

  constructor(public broadcastService: SyncProfileListBroadcastService,) {
    super();
  }

  ngOnInit(): void {
  }

  public onItemContentClick(profile: SyncProfileEntity): void {
  }

  public getDirectories(profile: SyncProfileEntity): string {
    if (profile.directories) {
      const directories = JSON.parse(profile.directories) as string[];
      if (directories?.length) {
        return directories.join(', ');
      }
    }
    return '[Not Selected]';
  }
}
