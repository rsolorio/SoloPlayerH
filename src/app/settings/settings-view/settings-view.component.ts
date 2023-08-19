import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { Milliseconds } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlaylistEntity, PlaylistSongEntity, SongEntity } from 'src/app/shared/entities';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { DialogService } from 'src/app/platform/dialog/dialog.service';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { FileService } from 'src/app/platform/file/file.service';
import { AudioMetadataService } from 'src/app/platform/audio-metadata/audio-metadata.service';
import { ScanService } from 'src/app/shared/services/scan/scan.service';
import { ISetting, ISettingCategory } from './settings-model.interface';
import { FileBrowserService } from 'src/app/platform/file-browser/file-browser.service';
import { AppRoute } from 'src/app/app-routes';
import { ModuleOptionName } from 'src/app/shared/models/module-option.enum';
import { IFileBrowserModel } from 'src/app/platform/file-browser/file-browser.interface';
import { MetaField } from 'src/app/mapping/data-transform/data-transform.enum';
import { MimeType } from 'src/app/core/models/core.enum';
import { IScanInfo, ISyncSongInfo } from 'src/app/shared/services/scan/scan.interface';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { AppActionIcons, AppAttributeIcons, AppFeatureIcons } from 'src/app/app-icons';

@Component({
  selector: 'sp-settings-view',
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.scss']
})
export class SettingsViewComponent extends CoreComponent implements OnInit {
  public settingsInfo: ISettingCategory[];
  constructor(
    private dialog: DialogService,
    private scanner: ScanService,
    private events: EventsService,
    private log: LogService,
    private db: DatabaseService,
    private entityService: DatabaseEntitiesService,
    private options: DatabaseOptionsService,
    private fileService: FileService,
    private metadataService: AudioMetadataService,
    private utility: UtilityService,
    private navbarService: NavBarStateService,
    private browserService: FileBrowserService,
    private loadingService: LoadingViewStateService)
  {
    super();
  }

  ngOnInit(): void {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.loadingService.show();
    this.initializeNavbar();
    await this.initializeSettings();
    this.loadingService.hide();
  }

  private initializeNavbar(): void {
    const routeInfo = this.utility.getCurrentRouteInfo();
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Some Option'
        }
      ],
      title: routeInfo.name,
      leftIcon: {
        icon: routeInfo.icon
      }
    });
  }

  private async initializeSettings(): Promise<void> {
    const musicPaths = this.options.getArray(ModuleOptionName.ScanMusicFolderPath);
    const playlistPaths = this.options.getArray(ModuleOptionName.ScanPlaylistFolderPath);
    const playlistCount = await PlaylistEntity.count();
    const songCount = await SongEntity.count();
    let hours = this.utility.secondsToHours(0);
    if (songCount) {
      const seconds = await this.entityService.getSecondsSum();
      hours = this.utility.secondsToHours(seconds);
    }
    this.settingsInfo = [
      {
        name: 'Media Library',
        settings: [
          {
            name: 'Statistics',
            icon: AppFeatureIcons.Statistics,
            dataType: 'text',
            descriptions: [],
            descriptionsLargeSize: [
              `Tracks: <span class="sp-color-primary sp-font-family-digital">${songCount}</span>`,
              `Playlists: <span class="sp-color-primary sp-font-family-digital">${playlistCount}</span>`,
              `Playing time: <span class="sp-color-primary sp-font-family-digital">${hours}</span>`
            ]
          },
          {
            name: 'Export Data',
            icon: AppActionIcons.ExportData,
            dataType: 'text',
            descriptions: ['Export data into a json file.'],
            action: setting => {
              setting.running = true;
              this.entityService.export().then(data => {
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
                setting.running = false;
                setting.disabled = false;
                this.utility.reloadRoute();
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
            name: 'Audio Directory',
            icon: AppAttributeIcons.AudioDirectory,
            dataType: 'text',
            descriptions: [
              ' Click here to set the sync directories for audio.',
              `Directories: <br><span class="sp-color-primary">${(musicPaths?.length ? musicPaths.join('<br>') : '[Not Selected]')}</span>`
            ],
            action: () => {
              this.showFileBrowserAndSave(ModuleOptionName.ScanMusicFolderPath);
            }
          },
          {
            name: 'Sync Audio Files',
            icon: 'mdi-sync mdi',
            dataType: 'text',
            descriptions: [
              'Click here to start synchronizing audio files; new files will be added to the database; missing files will be deleted from the database.',
              'Files found: 0'
            ],
            action: setting => {
              if (musicPaths && musicPaths.length) {
                this.onFolderScan(setting, musicPaths);
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
              'This feature will take artist tags and split every value by using separators. Click here to specify separators. Leave empty to disable the feature.'
            ]
          },
          {
            name: 'Multiple Genres',
            icon: AppFeatureIcons.MultipleGenres,
            dataType: 'text',
            descriptions: [
              'This feature will take genre tags and split every value by using separators. Click here to specify separators. Leave empty to disable the feature.'
            ]
          }
        ]
      },
      {
        name: 'Playlist Scanner',
        settings: [
          {
            name: 'Playlist Directory',
            icon: AppAttributeIcons.PlaylistDirectory,
            dataType: 'text',
            descriptions: [
              'Click here to set the scan directory for playlists',
              `Directories: <br><span class="sp-color-primary">${(playlistPaths?.length ? playlistPaths.join('<br>') : '[Not Selected]')}</span>`
            ],
            action: () => {
              this.showFileBrowserAndSave(ModuleOptionName.ScanPlaylistFolderPath);
            }
          },
          {
            name: 'Scan Playlist Files',
            icon: 'mdi-magnify-scan mdi',
            dataType: 'text',
            descriptions: [
              'Click here to start scanning playlists.',
              'Playlists created: 0/0'
            ],
            action: setting => {
              if (playlistPaths && playlistPaths.length) {
                this.onPlaylistScan(setting, playlistPaths);
              }
              else {
                setting.warningText = 'Unable to start scan. Please select the playlist directory first.';
              }
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

  onFolderScan(setting: ISetting, folderPaths: string[]): void {
    // Disable the setting
    setting.disabled = true;
    setting.running = true;
    const fileScanSub = this.events.onEvent<IScanInfo>(AppEvent.ScanFile).subscribe(scanFileInfo => {
      const lastFileInfo = scanFileInfo.items[scanFileInfo.items.length -1];
      setting.descriptions[1] = `Files found: ${scanFileInfo.fileCountProgress}`;
      setting.dynamicText = `${lastFileInfo.directoryPath} \n ${lastFileInfo.fullName}`;
    });
    this.subs.add(fileScanSub, 'settingsViewScanFile');
    // Start scanning
    const startTime = new Date().getTime();
    setting.descriptions[0] = 'Calculating file count...';
    this.scanner.scan(folderPaths, '.mp3').then(scanInfoResult => {
      // Calculation process done, delete subscription
      this.subs.unSubscribe('settingsViewScanFile');
      // Start reading file metadata
      setting.descriptions[0] = 'Reading metadata...';
      this.syncAudioFiles(scanInfoResult.items, setting).then(syncInfoResult => {
        // At this point the process is done.        
        let syncMessage = '';
        if (syncInfoResult.songAddedRecords.length) {
          syncMessage = `Added: ${syncInfoResult.songAddedRecords.length}.`;
        }
        if (syncInfoResult.songUpdatedRecords.length) {
          syncMessage += ` Updated: ${syncInfoResult.songUpdatedRecords.length}.`;
        }
        if (syncInfoResult.songSkippedRecords.length) {
          syncMessage += ` Skipped: ${syncInfoResult.songSkippedRecords.length}.`;
        }
        if (syncInfoResult.songDeletedRecords.length) {
          syncMessage += ` Deleted: ${syncInfoResult.songDeletedRecords.length}.`;
        }

        setting.descriptions[0] = 'Click here to start synchronizing audio files.';
        const errorFiles = syncInfoResult.metadataResults.filter(r => r[MetaField.Error].length);
        if (errorFiles.length) {
          syncMessage += ` Errors: ${errorFiles.length}.`;
          setting.dynamicText = '';
          setting.warningText = `Sync process done. ${syncMessage}`;
          this.log.debug('Sync failures', errorFiles);
        }
        else {
          setting.dynamicText = `Sync process done. ${syncMessage}`;
        }

        // Before logging the sync info remove all metadata, since that could be a lot of information
        syncInfoResult.metadataResults = [];
        this.log.debug('Sync info:', syncInfoResult);

        const endTime = new Date().getTime();
        const timeSpan =  this.utility.toTimeSpan(endTime - startTime,
          [Milliseconds.Hour, Milliseconds.Minute, Milliseconds.Second]);
        this.log.info('Elapsed time: ' + this.utility.formatTimeSpan(timeSpan), timeSpan);
        setting.running = false;
        setting.disabled = false;
      });
    });
  }

  public onSettingClick(setting: ISetting): void {
    if (setting.action && !setting.disabled) {
      setting.action(setting);
    }
  }

  private async syncAudioFiles(files: IFileInfo[], setting: ISetting): Promise<ISyncSongInfo> {
    const syncInfo = await this.scanner.syncAudioFiles(files,
      // Before file process
      async (count, file) => {
        setting.descriptions[1] = `File ${count} of ${files.length}`;
        setting.dynamicText = `${file.directoryPath} \n ${file.fullName}`;
      },
      // Before sync
      async () => {
        setting.descriptions[0] = 'Synchronizing changes...';
        setting.dynamicText = '';
      },
      // Before cleanup
      async () => {
        setting.descriptions[0] = 'Cleaning up...';
        setting.dynamicText = '';
      }
    );
    return syncInfo;
  }

  public onPlaylistScan(setting: ISetting, folderPaths: string[]): void {
    setting.disabled = true;
    setting.running = true;
    setting.descriptions[0] = 'Scanning playlists...';
    // Start scan process
    this.scanner.scan(folderPaths, '.m3u').then(scanInfo => {
      setting.descriptions[1] = 'Playlist created: 0/' + scanInfo.items.length;
      let playlistCount = 0;
      let trackCount = 0;
      // Subscribe
      const playlistCreatedSub = this.events.onEvent<PlaylistEntity>(AppEvent.ScanPlaylistCreated)
      .subscribe(playlist => {
        // New playlist
        playlistCount++;
        // Reset track count
        trackCount = 0;
        // Update status
        setting.descriptions[1] = `Playlist created: ${playlistCount}/${scanInfo.items.length}: ${playlist.name}.`;
      });
      this.subs.add(playlistCreatedSub, 'settingsViewScanPlaylistCreated');
      const trackAddedSub = this.events.onEvent<PlaylistSongEntity>(AppEvent.ScanTrackAdded)
      .subscribe(track => {
        trackCount++;
        setting.dynamicText = `Track added: ${trackCount} - ${track.song.name} - ${track.song.duration}.`;
      });
      this.subs.add(trackAddedSub, 'settingsViewScanTrackAdded');
      this.scanner.processPlaylistFiles(scanInfo.items).then(() => {
        // Process done, remove subs
        this.subs.unSubscribe('settingsViewScanPlaylistCreated');
        this.subs.unSubscribe('settingsViewScanTrackAdded');
        // Notify and enable back
        setting.descriptions[0] = 'Click here to start scanning playlists.'
        setting.dynamicText = 'Scan process done. No errors found.';
        setting.running = false;
        setting.disabled = false;
      });
    });
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

  private showFileBrowserAndSave(optionToSave: ModuleOptionName): void {
    // The onOk callback will be executed on the browser component
    const browserModel: IFileBrowserModel = {
      backRoute: AppRoute.Settings,
      onOk: async values => {
        // save value in DB
        await this.options.saveText(optionToSave, values.map(v => v.fileInfo.path));
        return true;
      }
    };
    this.browserService.browse(browserModel);
  }

  onTest(): void {
    this.test();
  }

  private async test(): Promise<void> {
    this.logFileMetadata();
  }
}
