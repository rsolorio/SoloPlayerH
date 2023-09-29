import { Injectable } from '@angular/core';
import { IStateService } from 'src/app/core/models/core.interface';
import { ModuleOptionId, SyncProfileId } from 'src/app/shared/services/database/database.seed';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { PlaylistEntity, SongEntity } from 'src/app/shared/entities';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons, AppFeatureIcons } from 'src/app/app-icons';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { IFileBrowserModel } from 'src/app/platform/file-browser/file-browser.interface';
import { AppRoute, appRoutes } from 'src/app/app-routes';
import { FileBrowserService } from 'src/app/platform/file-browser/file-browser.service';
import { DialogService } from 'src/app/platform/dialog/dialog.service';
import { ScanService } from 'src/app/sync-profile/scan/scan.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { MetaField } from 'src/app/mapping/data-transform/data-transform.enum';
import { EventsService } from 'src/app/core/services/events/events.service';
import { IScanItemInfo } from 'src/app/sync-profile/scan/scan.interface';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';
import { AppTestService } from 'src/app/app-test';
import { ExportService } from 'src/app/sync-profile/export/export.service';
import { IMetadataWriterOutput } from 'src/app/mapping/data-transform/data-transform.interface';
import { IExportResult } from 'src/app/sync-profile/export/export.interface';
import { LocalStorageService } from 'src/app/shared/services/local-storage/local-storage.service';
import { LocalStorageKeys } from 'src/app/shared/services/local-storage/local-storage.enum';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { ISetting, ISettingCategory } from 'src/app/shared/components/settings-base/settings-base.interface';

@Injectable({
  providedIn: 'root'
})
export class SettingsViewStateService implements IStateService<ISettingCategory[]> {
  private state: ISettingCategory[];
  constructor(
    private options: DatabaseOptionsService,
    private utility: UtilityService,
    private entities: DatabaseEntitiesService,
    private db: DatabaseService,
    private browserService: FileBrowserService,
    private dialog: DialogService,
    private scanner: ScanService,
    private log: LogService,
    private tester: AppTestService,
    private events: EventsService,
    private storage: LocalStorageService,
    private navigation: NavigationService,
    private exporter: ExportService)
  {
    this.subscribeToScanEvents();
    this.subscribeToExportEvents();
  }

  public getState(): ISettingCategory[] {
    return this.state;
  }

  private subscribeToScanEvents(): void {
    this.events.onEvent<IScanItemInfo<IFileInfo>>(AppEvent.ScanFile).subscribe(scanFileInfo => {
      // This can be scanning audio files or playlist files.
      if (scanFileInfo.scanId === 'scanAudio') {
        const setting = this.findSetting('syncAudioFiles');
        // By the time this is running the component might have been disposed and the object does not exist anymore
        if (!setting) {
          return;
        }
        setting.disabled = true;
        setting.running = true;
        setting.descriptions[0] = 'Calculating file count...';
        setting.descriptions[1] = `Files found: ${scanFileInfo.progress}`;
        setting.dynamicText = `${scanFileInfo.item.directoryPath} \n ${scanFileInfo.item.fullName}`;
      }
      else if (scanFileInfo.scanId === 'scanPlaylists') {
        // Nothing to do for now
        const setting = this.findSetting('processPlaylists');
        if (!setting) {
          return;
        }
        setting.disabled = true;
        setting.running = true;
        setting.descriptions[0] = 'Scanning playlists...';
      }
    });

    this.events.onEvent<IScanItemInfo<IFileInfo>>(AppEvent.ScanAudioFileStart).subscribe(scanFileInfo => {
      const setting = this.findSetting('syncAudioFiles');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.descriptions[0] = 'Reading metadata...';
      setting.descriptions[1] = `File ${scanFileInfo.progress} of ${scanFileInfo.total}`;
      setting.dynamicText = `${scanFileInfo.item.directoryPath} \n ${scanFileInfo.item.fullName}`;
    });

    this.events.onEvent(AppEvent.ScanAudioDbSyncStart).subscribe(() => {
      const setting = this.findSetting('syncAudioFiles');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.descriptions[0] = 'Synchronizing changes...';
      setting.dynamicText = '';
    });

    this.events.onEvent(AppEvent.ScanAudioDbCleanupStart).subscribe(() => {
      const setting = this.findSetting('syncAudioFiles');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.descriptions[0] = 'Cleaning up...';
      setting.dynamicText = '';
    });

    this.events.onEvent<IScanItemInfo<PlaylistEntity>>(AppEvent.ScanPlaylistCreated).subscribe(scanPlaylistInfo => {
      const setting = this.findSetting('processPlaylists');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.descriptions[1] = `Playlist created: ${scanPlaylistInfo.progress}/${scanPlaylistInfo.total}: ${scanPlaylistInfo.item.name}`;
    });

    this.events.onEvent<IScanItemInfo<IPlaylistSongModel>>(AppEvent.ScanTrackAdded).subscribe(scanTrackInfo => {
      const setting = this.findSetting('processPlaylists');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.dynamicText = `Track added: ${scanTrackInfo.progress} - ${scanTrackInfo.item.name} - ${scanTrackInfo.item.duration}`;
    });
  }

  private subscribeToExportEvents(): void {
    this.events.onEvent(AppEvent.ExportStart).subscribe(() => {
      const setting = this.findSetting('exportLibrary');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.descriptions[0] = 'Preparing export...';
      setting.dynamicText = '';
    });
    this.events.onEvent<IMetadataWriterOutput>(AppEvent.ExportAudioFileEnd).subscribe(exportAudioResult => {
      const setting = this.findSetting('exportLibrary');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.descriptions[0] = 'Exporting tracks to...';
      setting.dynamicText = exportAudioResult.destinationPath;
    });
    this.events.onEvent<IExportResult>(AppEvent.ExportSmartlistsStart).subscribe(exportResult => {
      const setting = this.findSetting('exportLibrary');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.descriptions[0] = 'Exporting smartlists to...';
      setting.dynamicText = 'Path: ' + exportResult.rootPath;
      if (exportResult.playlistFolder) {
        setting.dynamicText += '. Folder: ' + exportResult.playlistFolder;
      }
    });
    this.events.onEvent<IExportResult>(AppEvent.ExportAutolistsStart).subscribe(exportResult => {
      const setting = this.findSetting('exportLibrary');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.descriptions[0] = 'Exporting autolists...';
      setting.dynamicText = 'Path: ' + exportResult.rootPath;
      if (exportResult.playlistFolder) {
        setting.dynamicText += '. Folder: ' + exportResult.playlistFolder;
      }
    });
    this.events.onEvent<IExportResult>(AppEvent.ExportPlaylistsStart).subscribe(exportResult => {
      const setting = this.findSetting('exportLibrary');
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.descriptions[0] = 'Exporting playlists...';
      setting.dynamicText = 'Path: ' + exportResult.rootPath;
      if (exportResult.playlistFolder) {
        setting.dynamicText += '. Folder: ' + exportResult.playlistFolder;
      }
    });
    this.events.onEvent<IExportResult>(AppEvent.ExportEnd).subscribe(exportResult => {
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
      setting.descriptions[0] = 'Exporting process done.';
      setting.dynamicText = resultMessage;
      this.log.info('Export elapsed time: ' + this.utility.formatTimeSpan(exportResult.period.span), exportResult.period.span);
    });
  }

  /** Creates the list of settings. */
  public initializeState(): void {
    this.state = [
      {
        name: 'Media Library',
        settings: [
          {
            id: 'statistics',
            name: 'Statistics',
            icon: AppFeatureIcons.Statistics,
            dataType: 'text'
          },
          {
            name: 'Export Data',
            icon: AppActionIcons.ExportData,
            dataType: 'text',
            descriptions: ['Export data into a json file.'],
            action: setting => {
              setting.running = true;
              this.entities.exportColorSelectionData().then(data => {
                this.utility.downloadJson(data, 'sp-backup.json');
                setting.running = false;
              });
            }
          },
          {
            name: 'Purge Database',
            icon: AppActionIcons.DeleteData,
            dataType: 'text',
            descriptions: ['Deletes all data and recreates the database.'],
            action: setting => {
              setting.disabled = true;
              setting.running = true;
              this.db.purge().then(() => {
                this.options.init().then(() => {
                  setting.running = false;
                  setting.disabled = false;
                  this.updateState();
                });
              });
            }
          }
        ]
      },
      {
        name: 'Audio Synchronization',
        settings: [
          {
            name: 'Profiles',
            icon: AppEntityIcons.Sync,
            dataType: 'text',
            descriptions: ['Configuration for all import/export tasks.'],
            action: () => {
              this.navigation.forward(appRoutes[AppRoute.SyncProfiles].route);
            }
          },
          {
            id: 'audioDirectory',
            name: 'Audio Directory',
            icon: AppAttributeIcons.AudioDirectory,
            dataType: 'text',
            action: () => {
              this.showFileBrowserAndSave(SyncProfileId.DefaultAudioImport);
            }
          },
          {
            id: 'syncAudioFiles',
            name: 'Sync Audio Files',
            icon: AppEntityIcons.Sync,
            dataType: 'text',
            action: async setting => {
              const syncProfile = await this.entities.getSyncProfile(SyncProfileId.DefaultAudioImport);
              if (syncProfile.directoryArray && syncProfile.directoryArray.length) {
                // If the drive to scan is idle, the scan process might take a time to start and fire events
                // so disable the setting immediately
                setting.running = true;
                setting.disabled = true;
                this.onFolderScan(syncProfile.directoryArray);
              }
              else {
                setting.warningText = 'Unable to start sync. Please select the audio directory first.';
              }
            }
          },
          {
            name: 'Multiple Artists',
            icon: AppFeatureIcons.MultipleArtists,
            dataType: 'text',
            descriptions: [
              'This feature will take artist tags and split every value by using separators. Click here to specify separators. Leave it empty to disable the feature.'
            ]
          },
          {
            name: 'Multiple Genres',
            icon: AppFeatureIcons.MultipleGenres,
            dataType: 'text',
            descriptions: [
              'This feature will take genre tags and split every value by using separators. Click here to specify separators. Leave it empty to disable the feature.'
            ]
          }
        ]
      },
      {
        name: 'Playlist Scanner',
        settings: [
          {
            id: 'playlistDirectory',
            name: 'Playlist Directory',
            icon: AppAttributeIcons.PlaylistDirectory,
            dataType: 'text',
            action: () => {
              this.showFileBrowserAndSave(SyncProfileId.DefaultPlaylistImport);
            }
          },
          {
            id: 'processPlaylists',
            name: 'Scan Playlist Files',
            icon: AppActionIcons.Scan,
            dataType: 'text',
            action: async setting => {
              const syncProfile = await this.entities.getSyncProfile(SyncProfileId.DefaultPlaylistImport);
              if (syncProfile.directoryArray && syncProfile.directoryArray.length) {
                setting.running = true;
                setting.disabled = true;
                this.onPlaylistScan(syncProfile.directoryArray);
              }
              else {
                setting.warningText = 'Unable to start scan. Please select the playlist directory first.';
              }
            }
          }
        ]
      },
      {
        name: 'Export',
        settings: [
          {
            id: 'exportLibrary',
            name: 'Export Library',
            icon: AppActionIcons.Export,
            dataType: 'text',
            descriptions: [
              'Click here to export your library.'
            ],
            action: setting => {
              const exportProfileId = this.options.getText(ModuleOptionId.DefaultExportProfile);
              this.exporter.run(exportProfileId);
            }
          },
          {
            id: '',
            name: 'Export Configuration',
            icon: AppActionIcons.Config,
            dataType: 'text',
            descriptions: ['Click here to configure the export process.']
          }
        ]
      },
      {
        name: 'Navigation',
        settings: [
          {
            id: 'multipleQuickFilters',
            name: 'Multiple Quick Filters',
            icon: AppFeatureIcons.MultipleFilters,
            dataType: 'boolean',
            secondaryIcon: {
              icon: AppAttributeIcons.SwitchOn + ' sp-color-primary',
              off: true,
              offIcon: AppAttributeIcons.SwitchOff
            },
            descriptions: [
              'If turned off, the quick filter panel will allow to select one filter at a time; as soon as you click the filter the change will be applied.',
              'If turned on, the quick filter panel will allow to select multiple filters; you need to click OK to apply the changes.'
            ],
            action: setting => {
              this.options.saveBoolean(ModuleOptionId.AllowMultipleQuickFilters, setting.secondaryIcon.off).then(() => {
                setting.secondaryIcon.off = !setting.secondaryIcon.off;
              });
            }
          }
        ]
      },
      {
        name: 'Appearance',
        settings: [
          {
            // TODO: this should not be displayed in cordova mode
            name: 'Small Form Factor',
            icon: AppFeatureIcons.Mobile,
            dataType: 'text',
            descriptions: ['Resizes the window to a mobile form factor.'],
            action: () => {
              this.dialog.resizeWindow(this.utility.getSmallFormFactor());
            }
          }
        ]
      },
      {
        name: 'Developer Options',
        settings: [
          {
            name: 'Dev Tools',
            icon: AppActionIcons.Code,
            dataType: 'text',
            descriptions: ['Open developer tools.'],
            action: () => {
              this.dialog.openDevTools();
            }
          },
          {
            id: 'debugMode',
            name: 'Debug',
            icon: AppActionIcons.Debug,
            dataType: 'boolean',
            secondaryIcon: {
              icon: AppAttributeIcons.SwitchOn + ' sp-color-primary',
              off: !this.storage.getByKey(LocalStorageKeys.DebugMode),
              offIcon: AppAttributeIcons.SwitchOff
            },
            descriptions: ['Click here to turn on or off debug mode.'],
            action: setting => {
              setting.running = true;
              this.storage.setByKey(LocalStorageKeys.DebugMode, setting.secondaryIcon.off);
              setting.secondaryIcon.off = !setting.secondaryIcon.off;
              this.utility.reloadApp();
            }
          },
          {
            name: 'Test',
            icon: AppActionIcons.Test,
            dataType: 'text',
            descriptions: ['Action for testing purposes.'],
            action: () => {
              this.tester.test();
            }
          }
        ]
      }
    ];
  }

  /** Update settings values. */
  public async updateState(): Promise<void> {
    this.refreshStatistics();

    let setting = this.findSetting('audioDirectory');
    const audioSyncProfile = await this.entities.getSyncProfile(SyncProfileId.DefaultAudioImport);
    setting.descriptions = [
      ' Click here to set the sync directories for audio.',
      `Directories: <br><span class="sp-color-primary">${(audioSyncProfile.directoryArray?.length ? audioSyncProfile.directoryArray.join('<br>') : '[Not Selected]')}</span>`
    ];

    setting = this.findSetting('syncAudioFiles');
    setting.descriptions = [
      'Click here to start synchronizing audio files; new files will be added to the database; missing files will be deleted from the database.',
      'Files found: 0'
    ];
    setting.dynamicText = '';
    setting.warningText = '';

    setting = this.findSetting('playlistDirectory');
    const playlistSyncProfile = await this.entities.getSyncProfile(SyncProfileId.DefaultPlaylistImport);
    setting.descriptions = [
      'Click here to set the scan directory for playlists',
      `Directories: <br><span class="sp-color-primary">${(playlistSyncProfile.directoryArray?.length ? playlistSyncProfile.directoryArray.join('<br>') : '[Not Selected]')}</span>`
    ];

    setting = this.findSetting('processPlaylists');
    setting.descriptions = [
      'Click here to start scanning playlists.',
      'Playlists created: 0/0'
    ];
    setting.dynamicText = '';
    setting.warningText = '';

    setting = this.findSetting('multipleQuickFilters');
    const multipleQuickFilters = this.options.getBoolean(ModuleOptionId.AllowMultipleQuickFilters);
    setting.secondaryIcon.off = !multipleQuickFilters;
  }

  private async refreshStatistics(): Promise<void> {
    let setting = this.findSetting('statistics');
    const playlistCount = await PlaylistEntity.count();
    const songCount = await SongEntity.count();
    let hours = this.utility.secondsToHours(0);
    if (songCount) {
      const seconds = await this.entities.getSecondsSum();
      hours = this.utility.secondsToHours(seconds);
    }
    setting.descriptionsLargeSize = [
      `Tracks: <span class="sp-color-primary sp-font-family-digital">${songCount}</span>`,
      `Playlists: <span class="sp-color-primary sp-font-family-digital">${playlistCount}</span>`,
      `Playing time: <span class="sp-color-primary sp-font-family-digital">${hours}</span>`
    ];
  }

  private onFolderScan(folderPaths: string[]): void {
    // Start scanning
    this.scanner.run(folderPaths, '.mp3', 'scanAudio').then(scanProcessResult => {
      // Start reading file metadata
      this.scanner.syncAudioFiles(scanProcessResult.result).then(processResult => {
        // At this point the process is done.
        let syncMessage = '';
        if (processResult.result.songAddedRecords.length) {
          syncMessage = `Added: ${processResult.result.songAddedRecords.length}.`;
        }
        if (processResult.result.songUpdatedRecords.length) {
          syncMessage += ` Updated: ${processResult.result.songUpdatedRecords.length}.`;
        }
        if (processResult.result.songSkippedRecords.length) {
          syncMessage += ` Skipped: ${processResult.result.songSkippedRecords.length}.`;
        }
        if (processResult.result.songDeletedRecords.length) {
          syncMessage += ` Deleted: ${processResult.result.songDeletedRecords.length}.`;
        }
        if (processResult.result.ignoredFiles.length) {
          syncMessage += ` Ignored: ${processResult.result.ignoredFiles.length}`;
        }

        const setting = this.findSetting('syncAudioFiles');
        if (setting) {
          setting.descriptions[0] = 'Click here to start synchronizing audio files.';
          const errorFiles = processResult.result.metadataResults.filter(r => r[MetaField.Error].length);
          if (errorFiles.length) {
            syncMessage += ` Errors: ${errorFiles.length}.`;
            setting.dynamicText = '';
            setting.warningText = `Sync process done. ${syncMessage}`;
            this.log.debug('Sync failures', errorFiles);
          }
          // TODO: report ignored files
          else {
            setting.dynamicText = `Sync process done. ${syncMessage}`;
          }
          setting.running = false;
          setting.disabled = false;
        }
        // Before logging the sync info remove all metadata, since that could be a lot of information
        processResult.result.metadataResults = [];
        this.log.debug('Sync info:', processResult.result);
        this.log.info('Sync elapsed time: ' + this.utility.formatTimeSpan(processResult.period.span), processResult.period.span);
        this.refreshStatistics();
      });
    });
  }

  private onPlaylistScan(folderPaths: string[]): void {
    // Start scan process
    this.scanner.run(folderPaths, '.m3u', 'scanPlaylists').then(processResult => {
      let setting = this.findSetting('processPlaylists');
      if (setting) {
        setting.descriptions[1] = 'Playlist created: 0/' + processResult.result.length;
      }
      this.scanner.syncPlaylistFiles(processResult.result).then(() => {
        // Find it again
        setting = this.findSetting('processPlaylists');
        if (setting) {
          // Notify and enable back
          setting.descriptions[0] = 'Click here to start scanning playlists.'
          setting.dynamicText = 'Scan process done. No errors found.';
          setting.running = false;
          setting.disabled = false;
        }
        this.refreshStatistics();
      });
    });
  }

  private findSetting(id: string): ISetting {
    for (const settingCategory of this.state) {
      for (const setting of settingCategory.settings) {
        if (setting.id === id) {
          return setting;
        }
      }
    }
    return null;
  }

  private async showFileBrowserAndSave(syncProfileId: string): Promise<void> {
    // The onOk callback will be executed on the browser component
    const browserModel: IFileBrowserModel = {
      selectedItems: [],
      backRoute: AppRoute.Settings,
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
      syncProfile.directoryArray.forEach(d => browserModel.selectedItems.push({ id: d, name: '', canBeRendered: false}));
    }
    this.browserService.browse(browserModel);
  }
}
