import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { Milliseconds } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ModuleOptionEntity, PlaylistEntity, PlaylistSongEntity, SongEntity, SongViewEntity } from 'src/app/shared/entities';
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
import { OutputField } from 'src/app/mapping/data-transform/data-transform.enum';
import { KeyValues } from 'src/app/core/models/core.interface';

@Component({
  selector: 'sp-settings-view',
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.scss']
})
export class SettingsViewComponent extends CoreComponent implements OnInit {
  public settingsInfo: ISettingCategory[];
  private options: ModuleOptionEntity[];
  constructor(
    private dialog: DialogService,
    private scanner: ScanService,
    private events: EventsService,
    private log: LogService,
    private db: DatabaseService,
    private fileService: FileService,
    private metadataService: AudioMetadataService,
    private utility: UtilityService,
    private navbarService: NavBarStateService,
    private browserService: FileBrowserService,
    private loadingService: LoadingViewStateService) {
      super();
    }

  ngOnInit(): void {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.loadingService.show();
    this.initializeNavbar();
    this.options = await this.db.getModuleOptions();
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
    const musicPathOption = this.options.find(option => option.name === ModuleOptionName.ScanMusicFolderPath);
    const musicPath = await this.db.getOptionTextValue(musicPathOption);
    const playlistPathOptions = this.options.find(option => option.name === ModuleOptionName.ScanPlaylistFolderPath);
    const playlistPath = await this.db.getOptionTextValue(playlistPathOptions);
    const playlistCount = await PlaylistEntity.count();
    const songCount = await SongEntity.count();
    let hours = this.utility.secondsToHours(0);
    if (songCount) {
      const seconds = await this.db.getSecondsSum();
      hours = this.utility.secondsToHours(seconds);
    }
    this.settingsInfo = [
      {
        name: 'Media Library',
        settings: [
          {
            name: 'Statistics',
            icon: 'mdi-chart-bar mdi',
            dataType: 'text',
            descriptions: [
              `Tracks: <span class="sp-color-primary">${songCount}</span>`,
              `Playlists: <span class="sp-color-primary">${playlistCount}</span>`,
              `Playing time: <span class="sp-color-primary sp-font-family-digital">${hours}</span>`
            ]
          },
          {
            name: 'Export Data',
            icon: 'mdi-database-export mdi',
            dataType: 'text',
            descriptions: ['Export data into a json file.'],
            action: () => {}
          },
          {
            name: 'Purge Database',
            icon: 'mdi-database-remove mdi',
            dataType: 'text',
            descriptions: ['Deletes all data and recreates the database.'],
            action: settings => {
              settings.disabled = true;
              settings.running = true;
              this.db.purge().then(() => {
                settings.running = false;
                settings.disabled = false;
                this.utility.reloadRoute();
              });
            }
          }
        ]
      },
      {
        name: 'Audio Scanner',
        settings: [
          {
            name: 'Tag Mapping',
            icon: 'mdi-tag-text-outline mdi',
            dataType: 'text',
            descriptions: ['Configure the mapping between the audio tags and the database.']
          },
          {
            name: 'Audio Directory',
            icon: 'mdi-folder-music-outline mdi',
            dataType: 'text',
            descriptions: [
              ' Click here to set the scan directory for audio.',
              `Scan directory: <span class="sp-color-primary">${(musicPath ? musicPath : '[Not Selected]')}</span>`
            ],
            action: () => {
              this.showFileBrowserAndSave(ModuleOptionName.ScanMusicFolderPath);
            }
          },
          {
            name: 'Scan Audio Files',
            icon: 'mdi-magnify-scan mdi',
            dataType: 'text',
            descriptions: [
              'Click here to start scanning audio files.',
              'Files found: 0'
            ],
            action: setting => {
              if (musicPath) {
                this.onAudioScan(setting, musicPath);
              }
              else {
                setting.warningText = 'Unable to start scan. Please select the audio directory first.';
              }
            }
          }
        ]
      },
      {
        name: 'Playlist Scanner',
        settings: [
          {
            name: 'Playlist Directory',
            icon: 'mdi-folder-play-outline mdi',
            dataType: 'text',
            descriptions: [
              'Click here to set the scan directory for playlists',
              `Scan directory: <span class="sp-color-primary">${(playlistPath ? playlistPath : '[Not Selected]')}</span>`
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
              if (playlistPath) {
                this.onPlaylistScan(setting, playlistPath);
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
            icon: 'mdi-cellphone mdi',
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
            icon: 'mdi-bug mdi',
            dataType: 'text',
            descriptions: ['Open developer tools.'],
            action: () => {
              this.dialog.openDevTools();
            }
          },
          {
            name: 'Test',
            icon: 'mdi-test-tube mdi',
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

  onAudioScan(setting: ISetting, folderPath: string): void {
    // Disable the setting
    setting.disabled = true;
    setting.running = true;
    // Subscribe to files
    let fileCount = 0;
    const fileScanSub = this.events.onEvent<IFileInfo>(AppEvent.ScanFile).subscribe(fileInfo => {
      fileCount++;
      setting.descriptions[1] = `Files found: ${fileCount}`;
      setting.dynamicText = `${fileInfo.directoryPath} \n ${fileInfo.fullName}`;
    });
    this.subs.add(fileScanSub, 'settingsViewScanFile');
    // Start scanning
    const startTime = new Date().getTime();
    setting.descriptions[0] = 'Calculating file count...';
    this.scanner.scan(folderPath, '.mp3').then(mp3Files => {
      // Calculation process done, delete subscription
      this.subs.unSubscribe('settingsViewScanFile');
      // Start reading file metadata
      setting.descriptions[0] = 'Reading metadata...';
      this.processAudioFiles(mp3Files, setting).then(failures => {
        setting.descriptions[0] = 'Click here to start scanning audio files.';
        if (failures.length) {
          this.log.debug('Scan failures', failures);
          setting.dynamicText = '';
          setting.warningText = 'Scan process done. File errors found: ' + failures.length;
        }
        else {
          setting.dynamicText = 'Scan process done. No errors found.';
        }
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

  private async processAudioFiles(files: IFileInfo[], setting: ISetting): Promise<KeyValues[]> {
    const audios = await this.scanner.processAudioFiles(files, this.options,
      // Before file process
      async (count, file) => {
        setting.descriptions[1] = `File ${count} of ${files.length}`;
        setting.dynamicText = `${file.directoryPath} \n ${file.fullName}`;
      },
      // Before sync
      async () => {
        setting.descriptions[0] = 'Synchronizing changes...';
        setting.dynamicText = '';
      }
    );
    return audios.filter(audioInfo => audioInfo[OutputField.Error].length);
  }

  public onPlaylistScan(setting: ISetting, folderPath: string): void {
    setting.disabled = true;
    setting.running = true;
    setting.descriptions[0] = 'Scanning playlists...';
    // Start scan process
    this.scanner.scan(folderPath, '.m3u').then(playlistFiles => {
      setting.descriptions[1] = 'Playlist created: 0/' + playlistFiles.length;
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
        setting.descriptions[1] = `Playlist created: ${playlistCount}/${playlistFiles.length}: ${playlist.name}.`;
      });
      this.subs.add(playlistCreatedSub, 'settingsViewScanPlaylistCreated');
      const trackAddedSub = this.events.onEvent<PlaylistSongEntity>(AppEvent.ScanTrackAdded)
      .subscribe(track => {
        trackCount++;
        setting.dynamicText = `Track added: ${trackCount} - ${track.song.name} - ${track.song.duration}.`;
      });
      this.subs.add(trackAddedSub, 'settingsViewScanTrackAdded');
      this.processPlaylistFiles(playlistFiles).then(() => {
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

  private async processPlaylistFiles(files: IFileInfo[]): Promise<any> {
    for (const fileInfo of files) {
      await this.scanner.processPlaylistFile(fileInfo);
    }
  }

  onTest(): void {
    //this.testRegExp();

    const fileName = 'J:\\Music\\English\\Country\\Alan Jackson\\1992 - A Lot About Livin\' (And A Little \'Bout Love)\\01 - 01 - chattahoochee.mp3';
    //const regexp = new RegExp('(((?<media>.+) - )*(?<track>.+) - )*(?<title>.+).mp3', 'g');
    const regexp = new RegExp('(?<dummy>.+)\\\\(?<year>.+) - (?<album>.+)\\\\(?<media>.+) - (?<track>.+) - (?<title>.+)', 'g');
    const matchInfo = regexp.exec(fileName);
    console.log(matchInfo);
  }

  private async logFileMetadata(): Promise<void> {
    const selectedFiles = this.dialog.openFileDialog();
    if (selectedFiles && selectedFiles.length) {
      const fileInfo = await this.fileService.getFileInfo(selectedFiles[0]);
      const buffer = await this.fileService.getBuffer(fileInfo.path);
      const audioInfo = await this.metadataService.getMetadata(buffer, true);
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
        await this.db.saveModuleOptionText(optionToSave, values[0].fileInfo.path);        
        return true;
      }
    };
    this.browserService.browse(browserModel);
  }

  private async testRegExp(): Promise<void> {
    const allSongs = await SongViewEntity.find();
    const songs = allSongs;
    for (const song of songs) {
      const pathParts = song.filePath.split('\\').reverse();
      const fileName = pathParts[0].toLowerCase();
      // const dir1 = pathParts[1];
      // const dir2 = pathParts[2];
      // const dir3 = pathParts[3];
      // const dir4 = pathParts[4];
      // const dir5 = pathParts[5];

      // User input: %media% - %track% - %title%
      //const regexp = /(((?<media>.+) - )*(?<track>.+) - )*(?<title>.+).mp3/g;
      const regexp = new RegExp('(((?<media>.+) - )*(?<track>.+) - )*(?<title>.+).mp3', 'g');
      const matchInfo = regexp.exec(fileName);
      if (matchInfo && matchInfo.groups) {
        const mediaGroup = matchInfo.groups['media'];
        const trackGroup = matchInfo.groups['track'];
        const titleGroup = matchInfo.groups['title'];

        const mediaNumber = mediaGroup ? parseInt(mediaGroup, 10) : 1;
        const trackNumber = trackGroup ? parseInt(trackGroup, 10) : 0;
        const name = matchInfo.groups['title'];

        if (song.mediaNumber !== mediaNumber || song.trackNumber !== trackNumber || song.name.toLowerCase() !== name) {
          console.log(mediaGroup);
          console.log(trackGroup);
          console.log(titleGroup);
          console.log(song.filePath);
          console.log();
        }
      }
      else {
        console.log('no info or groups');
        console.log(song.filePath);
        console.log();
      }
    }
  }
}
