import { Injectable } from '@angular/core';
import { IStateService } from 'src/app/core/models/core.interface';
import { ISetting, ISettingCategory } from './settings-model.interface';
import { ModuleOptionId, SyncProfileId } from 'src/app/shared/services/database/database.seed';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { PlaylistEntity, PlaylistSongEntity, SongEntity } from 'src/app/shared/entities';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { AppActionIcons, AppAttributeIcons, AppFeatureIcons } from 'src/app/app-icons';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { IFileBrowserModel } from 'src/app/platform/file-browser/file-browser.interface';
import { AppRoute } from 'src/app/app-routes';
import { FileBrowserService } from 'src/app/platform/file-browser/file-browser.service';
import { DialogService } from 'src/app/platform/dialog/dialog.service';
import { ScanService } from 'src/app/shared/services/scan/scan.service';
import { FileService } from 'src/app/platform/file/file.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { AudioMetadataService } from 'src/app/platform/audio-metadata/audio-metadata.service';
import { MimeType } from 'src/app/core/models/core.enum';
import { MetaField } from 'src/app/mapping/data-transform/data-transform.enum';
import { EventsService } from 'src/app/core/services/events/events.service';
import { IScanItemInfo } from 'src/app/shared/services/scan/scan.interface';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';

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
    private fileService: FileService,
    private log: LogService,
    private metadataService: AudioMetadataService,
    private events: EventsService)
  {
    this.subscribeToScanEvents();
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
              this.entities.export().then(data => {
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
            name: 'Tag Mapping',
            icon: AppFeatureIcons.TagMapping,
            dataType: 'text',
            descriptions: ['Configure the mapping between the audio tags and the database.']
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
            icon: AppActionIcons.Sync,
            dataType: 'text',
            action: async setting => {
              const syncProfile = await this.entities.getSyncProfile(SyncProfileId.DefaultAudioImport);
              if (syncProfile.directories && syncProfile.directories.length) {
                // If the drive to scan is idle, the scan process might take a time to start and fire events
                // so disable the setting immediately
                setting.running = true;
                setting.disabled = true;
                this.onFolderScan(syncProfile.directories);
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
              if (syncProfile.directories && syncProfile.directories.length) {
                setting.running = true;
                setting.disabled = true;
                this.onPlaylistScan(syncProfile.directories);
              }
              else {
                setting.warningText = 'Unable to start scan. Please select the playlist directory first.';
              }
            }
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
        name: 'Debug',
        settings: [
          {
            name: 'Dev Tools',
            icon: AppActionIcons.Debug,
            dataType: 'text',
            descriptions: ['Open developer tools.'],
            action: () => {
              this.dialog.openDevTools();
            }
          },
          {
            name: 'Test',
            icon: AppActionIcons.Test,
            dataType: 'text',
            descriptions: ['Action for testing purposes.'],
            action: () => {
              this.onTest();
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
      `Directories: <br><span class="sp-color-primary">${(audioSyncProfile.directories?.length ? audioSyncProfile.directories.join('<br>') : '[Not Selected]')}</span>`
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
      `Directories: <br><span class="sp-color-primary">${(playlistSyncProfile.directories?.length ? playlistSyncProfile.directories.join('<br>') : '[Not Selected]')}</span>`
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
    this.scanner.scan(folderPaths, '.mp3', 'scanAudio').then(scanProcessResult => {
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
          else {
            setting.dynamicText = `Sync process done. ${syncMessage}`;
          }
          setting.running = false;
          setting.disabled = false;
        }
        // Before logging the sync info remove all metadata, since that could be a lot of information
        processResult.result.metadataResults = [];
        this.log.debug('Sync info:', processResult.result);
        this.log.info('Elapsed time: ' + this.utility.formatTimeSpan(processResult.time), processResult.time);
        this.refreshStatistics();
      });
    });
  }

  private onPlaylistScan(folderPaths: string[]): void {
    // Start scan process
    this.scanner.scan(folderPaths, '.m3u', 'scanPlaylists').then(processResult => {
      let setting = this.findSetting('processPlaylists');
      if (setting) {
        setting.descriptions[1] = 'Playlist created: 0/' + processResult.result.length;
      }
      this.scanner.processPlaylistFiles(processResult.result).then(() => {
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
        syncProfile.directories = browserModel.selectedItems.map(v => v.id);
        await this.entities.saveSyncProfile(syncProfile);
        return true;
      }
    };
    const syncProfile = await this.entities.getSyncProfile(syncProfileId);
    if (syncProfile.directories?.length) {
      syncProfile.directories.forEach(d => browserModel.selectedItems.push({ id: d, name: '', canBeRendered: false}));
    }
    this.browserService.browse(browserModel);
  }

  private async logFileMetadata(): Promise<void> {
    const selectedFiles = this.dialog.openFileDialog();
    if (selectedFiles && selectedFiles.length) {
      const fileInfo = await this.fileService.getFileInfo(selectedFiles[0]);
      const buffer = await this.fileService.getBuffer(fileInfo.path);
      const audioInfo = await this.metadataService.getMetadata(buffer, MimeType.Mp3, true);
      this.log.info('File info.', fileInfo);
      this.log.info('Audio info.', audioInfo);
    }
  }

  onTest(): void {
    this.test();
  }

  private async test(): Promise<void> {
    this.logFileMetadata();
  }
}
