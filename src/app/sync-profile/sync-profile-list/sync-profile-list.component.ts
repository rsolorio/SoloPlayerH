import { Component, OnInit, ViewChild } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { SyncProfileEntity } from 'src/app/shared/entities';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { Criteria } from 'src/app/shared/services/criteria/criteria.class';
import { SyncProfileListBroadcastService } from './sync-profile-list-broadcast.service';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons } from 'src/app/app-icons';
import { IFileBrowserModel } from 'src/app/platform/file-browser/file-browser.interface';
import { AppRoute } from 'src/app/app-routes';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { FileBrowserService } from 'src/app/platform/file-browser/file-browser.service';
import { ExportService } from '../export/export.service';
import { ISyncProfile, SyncType } from 'src/app/shared/models/sync-profile-model.interface';
import { ScanService } from '../scan/scan.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { ISettingCategory } from 'src/app/shared/components/settings-base/settings-base.interface';
import { SettingsEditorType } from 'src/app/shared/components/settings-base/settings-base.enum';

@Component({
  selector: 'sp-sync-profile-list',
  templateUrl: './sync-profile-list.component.html',
  styleUrls: ['./sync-profile-list.component.scss']
})
export class SyncProfileListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
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
    searchIconEnabled: true,
    breadcrumbsEnabled: true,
    broadcastService: this.broadcastService
  }
  // END - LIST MODEL

  constructor(
    public broadcastService: SyncProfileListBroadcastService,
    private browserService: FileBrowserService,
    private exporter: ExportService,
    private scanner: ScanService,
    private entities: DatabaseEntitiesService)
  {
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

  private runProfile(profile: ISyncProfile): void {
    if (profile.syncType === SyncType.ImportAudio) {
      // Don't ask for configuration, just run
      this.importAudio(profile);
    }
    else if (profile.syncType === SyncType.ImportPlaylists) {
      // Don't ask for configuration, just run
      this.importPlaylists(profile);
    }
    else if (profile.syncType === SyncType.ExportAll) {
      // Open config panel and then run
      this.showSettings(profile);
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

  private async importAudio(profile: ISyncProfile): Promise<void> {
    const parsedProfile = this.entities.parseSyncProfile(profile);
    const scanResponse = await this.scanner.run(parsedProfile.directoryArray, '.mp3');
    const syncResponse = await this.scanner.syncAudioFiles(scanResponse.result);
    // Log results
  }

  private async importPlaylists(profile: ISyncProfile): Promise<void> {
    const parsedProfile = this.entities.parseSyncProfile(profile);
    const scanResponse = await this.scanner.run(parsedProfile.directoryArray, '.m3u', 'scanPlaylists');
    const syncResponse = await this.scanner.syncPlaylistFiles(scanResponse.result);
  }

  private showSettings(profile: ISyncProfile): void {
    const parsedProfile = this.entities.parseSyncProfile(profile);
    this.settingsModel = [
      {
        name: profile.name,
        settings: [
          {
            name: 'Directories',
            icon: AppAttributeIcons.Directory,
            descriptions: parsedProfile.directoryArray
          },
          {
            name: 'Run',
            icon: AppActionIcons.Run,
            descriptions: ['Click here to start running the action.'],
            action: () => {
              this.exporter.run(profile.id);
            }
          },
          {
            name: 'Dedicated Playlist Folder',
            icon: AppAttributeIcons.PlaylistDirectory,
            descriptions: ['Dedicated folder for the playlist files.'],
            editorType: SettingsEditorType.YesNo
          },
          {
            name: 'Export Playlists',
            icon: AppEntityIcons.Playlist,
            descriptions: ['Whether or not playlists should be exported.'],
            editorType: SettingsEditorType.YesNo
          },
          {
            name: 'Export Smartlists',
            icon: AppEntityIcons.Smartlist,
            descriptions: ['Whether or not smartlists should be exported.'],
            editorType: SettingsEditorType.YesNo
          },
          {
            name: 'Export Autolists',
            icon: AppEntityIcons.Autolist,
            descriptions: ['Whether or not autolists should be exported.'],
            editorType: SettingsEditorType.YesNo
          },
          {
            name: 'Playlist Format',
            icon: AppAttributeIcons.FileInfo,
            descriptions: ['Select the playlist format to export.']
          },
          {
            name: 'Last Songs Added',
            icon: AppAttributeIcons.AddDate,
            descriptions: ['This number represents the last songs added to the library that will be exported.']
          },
          {
            name: 'Minimum Playlist Tracks',
            icon: AppAttributeIcons.Minimum,
            descriptions: ['The minimum number of tracks a playlist should have to be exported.']
          },
          {
            name: 'Maximum Playlist Tracks',
            icon: AppAttributeIcons.Maximum,
            descriptions: ['The maximum number of tracks a playlist will have when exported.']
          }
        ]
      }
    ];
    this.spListBaseComponent.model.showModal = true;
  }
}
