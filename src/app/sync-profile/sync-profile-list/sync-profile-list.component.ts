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
import { IExportConfig } from '../export/export.interface';

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
    if (profile.syncType === SyncType.ExportAll) {
      this.showExportSettings(profile);
    }
  }

  private showExportSettings(profile: ISyncProfile): void {
    const parsedProfile = this.entities.parseSyncProfile(profile);
    const exportConfig = parsedProfile.configObj as IExportConfig;
    this.settingsModel = [
      {
        name: profile.name,
        settings: [
          {
            name: 'Run',
            icon: AppActionIcons.Run,
            textRegular: ['Click here to start running the action.'],
            action: () => {
              this.exporter.run(profile.id);
            }
          },
          {
            name: 'Directory',
            icon: AppAttributeIcons.Directory,
            textRegular: ['Directory where audio and playlist files will be exported.'],
            textData: parsedProfile.directoryArray,
            data: parsedProfile.directoryArray
          },
          {
            name: 'Last Songs Added',
            icon: AppAttributeIcons.AddDate,
            textRegular: [
              'This number represents the last songs added to the library that will be exported.',
              'If this value is greater than zero, exporting static playlists will be disabled.'],
            editorType: SettingsEditorType.Number,
            data: exportConfig.lastAdded,
            textData: [exportConfig.lastAdded ? exportConfig.lastAdded.toString() : '0']
          },
          {
            name: 'Export Static Playlists',
            icon: AppEntityIcons.Playlist,
            textRegular: ['Whether or not static playlists should be exported.'],
            editorType: SettingsEditorType.YesNo,
            data: !exportConfig.playlistConfig.playlistsDisabled,
            disabled: exportConfig.lastAdded > 0,
            onChange: setting => {
              exportConfig.playlistConfig.playlistsDisabled = !setting.data;
              this.entities.saveSyncProfile(parsedProfile);
            }
          },
          {
            name: 'Export Smart Playlists',
            icon: AppEntityIcons.Smartlist,
            textRegular: ['Whether or not smart playlists should be exported.'],
            editorType: SettingsEditorType.YesNo,
            data: !exportConfig.playlistConfig.smartlistsDisabled,
            onChange: setting => {
              exportConfig.playlistConfig.smartlistsDisabled = !setting.data;
              this.entities.saveSyncProfile(parsedProfile);
            }
          },
          {
            name: 'Export Auto Playlists',
            icon: AppEntityIcons.Autolist,
            textRegular: ['Whether or not auto playlists should be exported.'],
            editorType: SettingsEditorType.YesNo,
            data: !exportConfig.playlistConfig.autolistsDisabled,
            onChange: setting => {
              exportConfig.playlistConfig.autolistsDisabled = !setting.data;
              this.entities.saveSyncProfile(parsedProfile);
            }
          },
          {
            name: 'Dedicated Playlist Folder',
            icon: AppAttributeIcons.PlaylistDirectory,
            textRegular: ['Whether or not playlist files should be saved on its own playlist folder.'],
            editorType: SettingsEditorType.YesNo,
            data: !exportConfig.playlistConfig.dedicatedDirectoryDisabled,
            onChange: setting => {
              exportConfig.playlistConfig.dedicatedDirectoryDisabled = !setting.data;
              this.entities.saveSyncProfile(parsedProfile);
            }
          },
          {
            name: 'Playlist Format',
            icon: AppAttributeIcons.FileInfo,
            textRegular: ['Select the playlist format to export.'],
            data: exportConfig.playlistConfig.format,
            textData: [exportConfig.playlistConfig.format.toUpperCase()]
          },
          {
            name: 'Minimum Playlist Tracks',
            icon: AppAttributeIcons.Minimum,
            textRegular: ['The minimum number of tracks a playlist should have to be exported.'],
            data: exportConfig.playlistConfig.minCount,
            textData: [exportConfig.playlistConfig.minCount ? exportConfig.playlistConfig.minCount.toString() : '0']
          },
          {
            name: 'Maximum Playlist Tracks',
            icon: AppAttributeIcons.Maximum,
            textRegular: ['The maximum number of tracks a playlist will have when exported.'],
            data: exportConfig.playlistConfig.maxCount,
            textData: [exportConfig.playlistConfig.maxCount ? exportConfig.playlistConfig.maxCount.toString() : '0']
          }
        ]
      }
    ];
    this.spListBaseComponent.model.showModal = true;
  }
}
