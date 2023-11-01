import { Component, OnInit, ViewChild } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { PlaylistEntity, SyncProfileEntity } from 'src/app/shared/entities';
import { Criteria } from 'src/app/shared/services/criteria/criteria.class';
import { SyncProfileListBroadcastService } from './sync-profile-list-broadcast.service';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons, AppFeatureIcons, AppViewIcons } from 'src/app/app-icons';
import { IFileBrowserModel } from 'src/app/platform/file-browser/file-browser.interface';
import { AppRoute } from 'src/app/app-routes';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { FileBrowserService } from 'src/app/platform/file-browser/file-browser.service';
import { ExportService } from '../export/export.service';
import { ISyncProfile, SyncType } from 'src/app/shared/models/sync-profile-model.interface';
import { ScanService } from '../scan/scan.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { ISetting, ISettingCategory } from 'src/app/shared/components/settings-base/settings-base.interface';
import { SettingsEditorType } from 'src/app/shared/components/settings-base/settings-base.enum';
import { IExportConfig, IExportResult } from '../export/export.interface';
import { IChipItem } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { IScanItemInfo, ISyncSongInfo } from '../scan/scan.interface';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { IProcessDuration } from 'src/app/core/models/core.interface';
import { MetaField } from 'src/app/mapping/data-transform/data-transform.enum';
import { LogService } from 'src/app/core/services/log/log.service';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';
import { IMetadataWriterOutput } from 'src/app/mapping/data-transform/data-transform.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { MpegTagVersion } from 'src/app/shared/models/music.enum';
import { FilterId } from 'src/app/shared/services/database/database.seed';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AppEvent } from 'src/app/app-events';
import { In } from 'typeorm';

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
    private events: EventsService,
    private log: LogService,
    private navigation: NavigationService,
    private utility: UtilityService,
    private navbarService: NavBarStateService,
    private entities: DatabaseEntitiesService)
  {
    super();
  }

  ngOnInit(): void {
  }

  private subscribeToImportAudioEvents(): void {
    this.subs.sink = this.events.onEvent<IScanItemInfo<IFileInfo>>(AppEvent.ScanFile).subscribe(scanFileInfo => {
      if (scanFileInfo.scanId !== 'scanAudio') {
        return;
      }
      const setting = this.findSetting('syncAudioFiles');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Calculating file count...';
      setting.textRegular[1] = `Files found: ${scanFileInfo.progress}`;
      setting.textRegular[2] = `${scanFileInfo.item.directoryPath} \n ${scanFileInfo.item.fullName}`;
    });

    this.subs.sink = this.events.onEvent<IScanItemInfo<IFileInfo>>(AppEvent.ScanAudioFileStart).subscribe(scanFileInfo => {
      const setting = this.findSetting('syncAudioFiles');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Reading metadata...';
      setting.textRegular[1] = `File ${scanFileInfo.progress} of ${scanFileInfo.total}`;
      setting.textRegular[2] = `${scanFileInfo.item.directoryPath} \n ${scanFileInfo.item.fullName}`;
    });

    this.subs.sink = this.events.onEvent(AppEvent.ScanAudioDbSyncStart).subscribe(() => {
      const setting = this.findSetting('syncAudioFiles');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Synchronizing changes...';
      setting.textRegular[1] = '';
      setting.textRegular[2] = '';
    });

    this.subs.sink = this.events.onEvent(AppEvent.ScanAudioDbCleanupStart).subscribe(() => {
      const setting = this.findSetting('syncAudioFiles');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Cleaning up...';
      setting.textRegular[1] = '';
      setting.textRegular[2] = '';
    });

    this.subs.sink = this.events.onEvent<IProcessDuration<ISyncSongInfo>>(AppEvent.ScanAudioEnd).subscribe(processInfo => {
      const setting = this.findSetting('syncAudioFiles');
      if (!setting) {
        return;
      }

      let syncMessage = '';
      if (processInfo.result.songAddedRecords.length) {
        syncMessage = `Added: ${processInfo.result.songAddedRecords.length}.`;
      }
      if (processInfo.result.songUpdatedRecords.length) {
        syncMessage += ` Updated: ${processInfo.result.songUpdatedRecords.length}.`;
      }
      if (processInfo.result.songSkippedRecords.length) {
        syncMessage += ` Skipped: ${processInfo.result.songSkippedRecords.length}.`;
      }
      if (processInfo.result.songDeletedRecords.length) {
        syncMessage += ` Deleted: ${processInfo.result.songDeletedRecords.length}.`;
      }
      if (processInfo.result.ignoredFiles.length) {
        syncMessage += ` Ignored: ${processInfo.result.ignoredFiles.length}`;
      }
      
      setting.textRegular[0] = 'Click here to start synchronizing audio files.';
      const errorFiles = processInfo.result.metadataResults.filter(r => r[MetaField.Error].length);
      if (errorFiles.length) {
        syncMessage += ` Errors: ${errorFiles.length}.`;
        setting.textWarning = `Sync process done. ${syncMessage}`;
        this.log.debug('Sync failures', errorFiles);
      }
      // TODO: report ignored files
      else {
        setting.textRegular[1] = `Sync process done. ${syncMessage}`;
      }
      setting.textRegular[2] = '';

      setting.disabled = false;
      setting.running = false;
    });
  }

  private subscribeToImportPlaylistEvents(): void {
    this.subs.sink = this.events.onEvent<IScanItemInfo<IFileInfo>>(AppEvent.ScanFile).subscribe(scanFileInfo => {
      if (scanFileInfo.scanId !== 'scanPlaylists') {
        return;
      }
      const setting = this.findSetting('processPlaylists');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Scanning playlists...';
    });

    this.subs.sink = this.events.onEvent<IScanItemInfo<PlaylistEntity>>(AppEvent.ScanPlaylistCreated).subscribe(scanPlaylistInfo => {
      const setting = this.findSetting('processPlaylists');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[1] = `Playlist created: ${scanPlaylistInfo.progress}/${scanPlaylistInfo.total}: ${scanPlaylistInfo.item.name}`;
    });

    this.subs.sink = this.events.onEvent<IScanItemInfo<IPlaylistSongModel>>(AppEvent.ScanTrackAdded).subscribe(scanTrackInfo => {
      const setting = this.findSetting('processPlaylists');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[2] = `Track added: ${scanTrackInfo.progress} - ${scanTrackInfo.item.name} - ${scanTrackInfo.item.duration}`;
    });

    this.subs.sink = this.events.onEvent<IProcessDuration<ISyncSongInfo>>(AppEvent.ScanPlaylistEnd).subscribe(() => {
      const setting = this.findSetting('processPlaylists');
      if (!setting) {
        return;
      }
      
      setting.textRegular[0] = 'Click here to start scanning playlists.';
      setting.textRegular[1] = 'Scan process done. No errors found.';
      setting.textRegular[2] = '';

      setting.disabled = false;
      setting.running = false;
    });
  }

  private subscribeToExportEvents(): void {
    this.subs.sink = this.events.onEvent(AppEvent.ExportStart).subscribe(() => {
      const setting = this.findSetting('exportLibrary');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Preparing export...';
    });

    this.subs.sink = this.events.onEvent<IMetadataWriterOutput>(AppEvent.ExportAudioFileEnd).subscribe(exportAudioResult => {
      const setting = this.findSetting('exportLibrary');
      if (!setting) {
        return;
      }
      const pathParts = exportAudioResult.destinationPath.split('\\');
      const fileName = pathParts[pathParts.length - 1];
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = `Exporting track ${exportAudioResult.count} to...`;
      setting.textRegular[1] = exportAudioResult.destinationPath.replace(fileName, '');
      setting.textRegular[2] = fileName;
    });

    this.subs.sink = this.events.onEvent<IExportResult>(AppEvent.ExportSmartlistsStart).subscribe(exportResult => {
      const setting = this.findSetting('exportLibrary');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Exporting smartlists to...';
      setting.textRegular[1] = 'Path: ' + exportResult.rootPath;
      if (exportResult.playlistFolder) {
        setting.textRegular[1] += '. Folder: ' + exportResult.playlistFolder;
      }
      setting.textRegular[2] = '';
    });

    this.subs.sink = this.events.onEvent<IExportResult>(AppEvent.ExportAutolistsStart).subscribe(exportResult => {
      const setting = this.findSetting('exportLibrary');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Exporting autolists...';
      setting.textRegular[1] = 'Path: ' + exportResult.rootPath;
      if (exportResult.playlistFolder) {
        setting.textRegular[1] += '. Folder: ' + exportResult.playlistFolder;
      }
    });

    this.subs.sink = this.events.onEvent<IExportResult>(AppEvent.ExportPlaylistsStart).subscribe(exportResult => {
      const setting = this.findSetting('exportLibrary');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Exporting playlists...';
      setting.textRegular[1] = 'Path: ' + exportResult.rootPath;
      if (exportResult.playlistFolder) {
        setting.textRegular[1] += '. Folder: ' + exportResult.playlistFolder;
      }
    });

    this.subs.sink = this.events.onEvent<IExportResult>(AppEvent.ExportEnd).subscribe(exportResult => {
      const setting = this.findSetting('exportLibrary');
      if (!setting) {
        return;
      }
      let resultMessage = '';
      resultMessage += `Processed files: ${exportResult.totalFileCount}.`;
      resultMessage += ` Exported files: ${exportResult.finalFileCount}.`;
      resultMessage += ` Exported playlists: ${exportResult.playlistCount}.`;
      resultMessage += ` Exported smartlists: ${exportResult.smartlistCount}.`;
      resultMessage += ` Exported autolists: ${exportResult.autolistCount}.`;
      setting.disabled = false;
      setting.running = false;
      setting.textRegular[0] = 'Exporting process done.';
      setting.textRegular[1] = resultMessage;
      this.log.info('Export elapsed time: ' + this.utility.formatTimeSpan(exportResult.period.span), exportResult.period.span);
    });
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

  private async importAudio(profile: ISyncProfile): Promise<void> {
    profile.running = true;
    const parsedProfile = this.entities.parseSyncProfile(profile);
    const syncResponse = await this.scanner.scanAndSyncAudio(parsedProfile.directoryArray, '.mp3', 'scanAudio');
    profile.running = false;
    // Log results
  }

  private async importPlaylists(profile: ISyncProfile): Promise<void> {
    profile.running = true;
    const parsedProfile = this.entities.parseSyncProfile(profile);
    const syncResponse = await this.scanner.scanAndSyncPlaylists(parsedProfile.directoryArray, '.m3u', 'scanPlaylists');
    profile.running = false;
    // Log results
  }

  private async exportAudio(profile: ISyncProfile): Promise<void> {
    profile.running = true;
    await this.exporter.run(profile.id);
    profile.running = false;
  }

  private showSettings(profile: ISyncProfile): void {
    if (profile.syncType === SyncType.ExportAll) {
      this.showExportSettings(profile);
    }
    else if (profile.syncType === SyncType.ImportAudio) {
      this.showImportAudioSettings(profile);
    }
    else if (profile.syncType === SyncType.ImportPlaylists) {
      this.showImportPlaylistsSettings(profile);
    }
  }

  private showImportAudioSettings(profile: ISyncProfile): void {
    this.subscribeToImportAudioEvents();
    this.settingsModel = [
      {
        name: 'Actions',
        settings: [
          {
            id: 'syncAudioFiles',
            name: 'Run',
            icon: AppActionIcons.Run,
            textRegular: ['Click here to start the import audio process.'],
            action: () => {
              this.importAudio(profile);
            }
          },
          {
            name: 'Recently Added',
            icon: AppAttributeIcons.Recent,
            textRegular: ['Display recently added tracks.'],
            action: () => {
              this.entities.updateFilterAccessDate(FilterId.RecentlyAdded).then(() => {
                this.entities.getCriteriaFromFilterId(FilterId.RecentlyAdded).then(criteria => {
                  this.navigation.forward(AppRoute.Songs, { criteria: criteria });
                });
              });
            }
          }
        ]
      }
    ];
    this.showModal(profile);
  }

  private showImportPlaylistsSettings(profile: ISyncProfile): void {
    // id: processPlaylists
    this.subscribeToImportPlaylistEvents();
    this.settingsModel = [];
    this.showModal(profile);
  }

  private showExportSettings(profile: ISyncProfile): void {
    this.subscribeToExportEvents();
    const parsedProfile = this.entities.parseSyncProfile(profile);
    const exportConfig = parsedProfile.configObj as IExportConfig;
    this.settingsModel = [
      {
        name: 'General',
        settings: [
          {
            name: 'Go Back',
            icon: AppActionIcons.Back,
            textRegular: ['Go back to the list of profiles.'],
            action: () => {
              const navbarModel = this.navbarService.getState();
              navbarModel.title = 'Profiles';
              navbarModel.leftIcon = {
                icon: AppEntityIcons.Sync
              };
              navbarModel.rightIcons.find(i => i.id === 'searchIcon').hidden = false;
              this.spListBaseComponent.model.showModal = false;
            }
          },
          {
            id: 'exportLibrary',
            name: 'Run',
            icon: AppActionIcons.Run,
            textRegular: ['Click here to start running the export process.'],
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
            textData: [exportConfig.lastAdded ? exportConfig.lastAdded.toString() : '0'],
            beforePanelOpen: async panelModel => {
              panelModel['label'] = 'Last number of songs';
            },
            onChange: setting => {
              exportConfig.lastAdded = parseInt(setting.data.toString(), 10);
              setting.textData = [exportConfig.lastAdded ? exportConfig.lastAdded.toString() : '0'];
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            name: 'Mpeg Tag Version',
            icon: AppFeatureIcons.TagMapping,
            textRegular: ['The ID3 tag version to be used when writing the audio metadata. This setting only applies to mp3 files.'],
            editorType: SettingsEditorType.List,
            textData: [exportConfig.mpegTag],
            beforePanelOpen: async panelModel => {
              const chipItem1: IChipItem = { sequence: 1, value: MpegTagVersion.Id3v23, caption: MpegTagVersion.Id3v23 };
              if (chipItem1.value === exportConfig.mpegTag) {
                chipItem1.selected = true;
              }
              const chipItem2: IChipItem = { sequence: 2, value: MpegTagVersion.Id3v24, caption: MpegTagVersion.Id3v24 };
              if (chipItem2.value === exportConfig.mpegTag) {
                chipItem2.selected = true;
              }
              panelModel['items'] = [chipItem1, chipItem2];
            },
            onChange: setting => {
              exportConfig.mpegTag = setting.data;
              setting.textData = [setting.data];
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          }
        ]
      },
      {
        name: 'Playlist Settings',
        settings: [
          {
            name: 'Export Static Playlists',
            icon: AppEntityIcons.Playlist,
            textRegular: ['Whether or not all static playlists should be exported.'],
            editorType: SettingsEditorType.YesNo,
            data: !exportConfig.playlistConfig.playlistsDisabled,
            disabled: exportConfig.lastAdded > 0,
            onChange: setting => {
              exportConfig.playlistConfig.playlistsDisabled = !setting.data;
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            id: 'exportSelectedPlaylists',
            name: 'Export Selected Playlists',
            icon: AppEntityIcons.Playlist,
            textRegular: ['Select playlists to export'],
            editorType: SettingsEditorType.ListMultiple,
            data: exportConfig.playlistConfig?.ids,
            beforePanelOpen: async panelModel => {
              const playlists = await PlaylistEntity.find();
              const chips: IChipItem[] = [];
              this.utility.sort(playlists, 'name').forEach(playlist => {
                chips.push({
                  value: playlist.id,
                  caption: playlist.name,
                  selected: exportConfig.playlistConfig?.ids?.length && exportConfig.playlistConfig.ids.includes(playlist.id)
                })
              });
              panelModel['items'] = chips;
            },
            onChange: settings => {
              if (!exportConfig.playlistConfig) {
                exportConfig.playlistConfig = {};
              }
              exportConfig.playlistConfig.ids = settings.data;
              this.entities.saveSyncProfile(parsedProfile).then(result => {
                profile.config = result.config;
                this.getPlaylistNames(exportConfig.playlistConfig.ids).then(names => {
                  settings.textData = [names];
                });
              });
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
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
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
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
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
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            name: 'Playlist Format',
            icon: AppAttributeIcons.FileInfo,
            textRegular: ['Select the playlist format to export.'],
            editorType: SettingsEditorType.List,
            data: exportConfig.playlistConfig.format,
            textData: [exportConfig.playlistConfig.format.toUpperCase()],
            beforePanelOpen: async panelModel => {
              const chipItemM3u: IChipItem = {
                sequence: 1, value: 'm3u', caption: 'M3U', selected: exportConfig.playlistConfig.format === 'm3u' };
              const chipItemPls: IChipItem = {
                sequence: 2, value: 'pls', caption: 'PLS', selected: exportConfig.playlistConfig.format === 'pls' };
              panelModel['items'] = [chipItemM3u, chipItemPls];
            },
            onChange: setting => {
              exportConfig.playlistConfig.format = setting.data;
              setting.textData = [exportConfig.playlistConfig.format.toUpperCase()];
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            name: 'Minimum Playlist Tracks',
            icon: AppAttributeIcons.Bottom,
            textRegular: ['The minimum number of tracks a playlist should have to be exported.'],
            editorType: SettingsEditorType.Number,
            data: exportConfig.playlistConfig.minCount,
            textData: [exportConfig.playlistConfig.minCount ? exportConfig.playlistConfig.minCount.toString() : '0'],
            beforePanelOpen: async panelModel => {
              panelModel['label'] = 'Minimum number of tracks';
            },
            onChange: setting => {
              exportConfig.playlistConfig.minCount = setting.data;
              setting.textData = [exportConfig.playlistConfig.minCount ? exportConfig.playlistConfig.minCount.toString() : '0'];
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            name: 'Maximum Playlist Tracks',
            icon: AppAttributeIcons.Top,
            textRegular: ['The maximum number of tracks a playlist will have when exported.'],
            editorType: SettingsEditorType.Number,
            data: exportConfig.playlistConfig.maxCount,
            textData: [exportConfig.playlistConfig.maxCount ? exportConfig.playlistConfig.maxCount.toString() : '0'],
            beforePanelOpen: async panelModel => {
              panelModel['label'] = 'Maximum number of tracks';
            },
            onChange: setting => {
              exportConfig.playlistConfig.maxCount = setting.data;
              setting.textData = [exportConfig.playlistConfig.maxCount ? exportConfig.playlistConfig.maxCount.toString() : '0'];
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          }
        ]
      }
    ];
    this.showModal(profile);
    const setting = this.findSetting('exportSelectedPlaylists');
    this.getPlaylistNames(exportConfig.playlistConfig?.ids).then(names => {
      setting.textData = [names];
    });
  }

  private async getPlaylistNames(ids: string[]): Promise<string> {
    if (ids?.length) {
      const playlists = await PlaylistEntity.findBy({ id: In(ids) });
      return playlists.map(p => p.name).join(', ');
    }
    return null;
  }

  private refreshScanAudioStatus(profile: ISyncProfile): void {
    profile.running = this.scanner.isAudioSyncRunning;
  }

  private findSetting(id: string): ISetting {
    for (const settingCategory of this.settingsModel) {
      for (const setting of settingCategory.settings) {
        if (setting.id === id) {
          return setting;
        }
      }
    }
    return null;
  }

  private showModal(profile: ISyncProfile): void {
    const navbarModel = this.navbarService.getState();
    navbarModel.title = profile.name;
    navbarModel.leftIcon = {
      icon: profile.syncType === SyncType.ExportAll ? AppActionIcons.Export : AppActionIcons.Import
    };
    navbarModel.rightIcons.find(i => i.id === 'searchIcon').hidden = true;
    this.spListBaseComponent.model.showModal = true;
  }
}
