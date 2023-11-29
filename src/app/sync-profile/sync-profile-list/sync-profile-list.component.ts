import { Component, OnInit } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { SyncProfileEntity } from 'src/app/shared/entities';
import { Criteria } from 'src/app/shared/services/criteria/criteria.class';
import { SyncProfileListBroadcastService } from './sync-profile-list-broadcast.service';
import { AppActionIcons, AppAttributeIcons, AppViewIcons } from 'src/app/app-icons';
import { IFileBrowserModel } from 'src/app/platform/file-browser/file-browser.interface';
import { AppRoute } from 'src/app/app-routes';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { FileBrowserService } from 'src/app/platform/file-browser/file-browser.service';
import { ExportService } from '../export/export.service';
import { ISyncProfile, SyncType } from 'src/app/shared/models/sync-profile-model.interface';
import { ScanService } from '../scan/scan.service';
import { ISettingCategory } from 'src/app/shared/components/settings-base/settings-base.interface';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AppEvent } from 'src/app/app-events';
import { ListBaseService } from 'src/app/shared/components/list-base/list-base.service';
import { SettingsViewId } from 'src/app/settings/settings-view/settings-view.enum';

@Component({
  selector: 'sp-sync-profile-list',
  templateUrl: './sync-profile-list.component.html',
  styleUrls: ['./sync-profile-list.component.scss']
})
export class SyncProfileListComponent extends CoreComponent implements OnInit {
  public SyncType = SyncType;
  public AppActionIcons = AppActionIcons;
  public AppAttributeIcons = AppAttributeIcons;
  public settingsModel: ISettingCategory[];
  // START - LIST MODEL
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.SyncProfileListUpdated,
    itemMenuList: [
      {
        caption: 'Directories',
        icon: AppAttributeIcons.Directory,
        action: (menuItem, param) => {
          const syncProfile = param as SyncProfileEntity;
          this.showFileBrowserAndSave(syncProfile.id);
        }
      },
      {
        caption: 'Settings',
        icon: AppViewIcons.Settings,
        action: (menuItem, param) => {
          const syncProfile = param as SyncProfileEntity;
          this.showSettings(syncProfile);
        }
      },
      {
        caption: 'Run',
        icon: AppActionIcons.Run,
        action: (menuItem, param) => {
          const syncProfile = param as SyncProfileEntity;
          this.runProfile(syncProfile);
        }
      }
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    rightIcons: [
      this.listBaseService.createSearchIcon('searchIcon')
    ],
    breadcrumbsEnabled: true,
    broadcastService: this.broadcastService
  }
  // END - LIST MODEL

  constructor(
    public broadcastService: SyncProfileListBroadcastService,
    private browserService: FileBrowserService,
    private exporter: ExportService,
    private scanner: ScanService,
    private navigation: NavigationService,
    private entities: DatabaseEntitiesService,
    private listBaseService: ListBaseService
  ){
    super();
  }

  ngOnInit(): void {
  }

  public onItemContentClick(profile: ISyncProfile): void {
    if (profile.running) {
      this.showSettings(profile);
    }
    else if (profile.directories) {
      // Just run it
      this.runProfile(profile);
    }
    else {
      // Show the folder browser
      this.showFileBrowserAndSave(profile.id);
    }
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

  private async runProfile(profile: ISyncProfile): Promise<void> {
    if (profile.syncType === SyncType.ImportAudio) {
      await this.importAudio(profile);
    }
    else if (profile.syncType === SyncType.ImportPlaylists) {
      await this.importPlaylists(profile);
    }
    else if (profile.syncType === SyncType.ExportAll) {
      await this.exportAudio(profile);
    }
  }

  private async showFileBrowserAndSave(syncProfileId: string): Promise<void> {
    // The onOk callback will be executed on the browser component
    const browserModel: IFileBrowserModel = {
      selectedItems: [],
      backRoute: AppRoute.SyncProfiles,
      onOk: async browserModel => {
        // save value in DB
        const syncProfile = await this.entities.getSyncProfile(syncProfileId);
        syncProfile.directoryArray = browserModel.selectedItems.map(v => v.id);
        await this.entities.saveSyncProfile(syncProfile);
        return true;
      }
    };
    const syncProfile = await this.entities.getSyncProfile(syncProfileId);
    if (syncProfile.directoryArray?.length) {
      syncProfile.directoryArray.forEach(d => browserModel.selectedItems.push({ id: d, name: '', canBeRendered: false }));
    }
    this.browserService.browse(browserModel);
  }

  private async importPlaylists(profile: ISyncProfile): Promise<void> {
    profile.running = true;
    const parsedProfile = this.entities.parseSyncProfile(profile);
    const syncResponse = await this.scanner.scanAndSyncPlaylists(parsedProfile.directoryArray, '.m3u', 'scanPlaylists');
    profile.running = false;
    // Log results
  }

  private async importAudio(profile: ISyncProfile): Promise<void> {
    profile.running = true;
    const parsedProfile = this.entities.parseSyncProfile(profile);
    const syncResponse = await this.scanner.scanAndSyncAudio(parsedProfile.directoryArray, '.mp3', 'scanAudio');
    profile.running = false;
    // Log results
  }

  private async exportAudio(profile: ISyncProfile): Promise<void> {
    profile.running = true;
    await this.exporter.run(profile.id);
    profile.running = false;
  }

  private showSettings(profile: ISyncProfile): void {
    const routeParams: any[] = [];
    if (profile.syncType === SyncType.ExportAll) {
      routeParams.push(SettingsViewId.Export);
    }
    else if (profile.syncType === SyncType.ImportAudio) {
      routeParams.push(SettingsViewId.ImportAudio);
    }
    else if (profile.syncType === SyncType.ImportPlaylists) {
      routeParams.push(SettingsViewId.ImportPlaylists);
    }
    this.navigation.forward(AppRoute.Settings, { routeParams: routeParams, queryParams: { id: profile.id, title: profile.name } });
  }

  private refreshScanAudioStatus(profile: ISyncProfile): void {
    profile.running = this.scanner.isAudioSyncRunning;
  }
}
