import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { DefaultImageSrc } from 'src/app/core/globals.enum';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { Milliseconds } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlaylistEntity, PlaylistSongEntity } from 'src/app/shared/entities';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { DialogService } from 'src/app/shared/services/dialog/dialog.service';
import { IFileInfo } from 'src/app/shared/services/file/file.interface';
import { FileService } from 'src/app/shared/services/file/file.service';
import { IAudioInfo } from 'src/app/shared/services/music-metadata/music-metadata.interface';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
import { ScanService } from 'src/app/shared/services/scan/scan.service';
import { ISetting, ISettingCategory } from './settings-model.interface';

@Component({
  selector: 'sp-settings-view',
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.scss']
})
export class SettingsViewComponent extends CoreComponent implements OnInit {
  public DefaultImageSrc = DefaultImageSrc;
  public transitionSrc: string = null;
  public settingsInfo: ISettingCategory[];
  constructor(
    private dialog: DialogService,
    private scanner: ScanService,
    private events: EventsService,
    private log: LogService,
    private db: DatabaseService,
    private fileService: FileService,
    private metadataService: MusicMetadataService,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService) {
      super();
    }

  ngOnInit(): void {
    this.initializeSettings();
    this.subs.sink = this.events.onEvent<IFileInfo>(AppEvent.ScanFile).subscribe(fileInfo => {
      this.log.info('ScanFile event fired.',  fileInfo.path);
    });
  }

  private initializeSettings(): void {
    this.settingsInfo = [
      {
        name: 'Media Library',
        settings: [
          {
            name: 'Statistics',
            dataType: 'text',
            descriptions: [
              'Number of tracks: 0',
              'Total playing time: 00:00'
            ]
          },
          {
            name: 'Audio Scanner',
            dataType: 'text',
            descriptions: [
              'Click here to start scanning audio files.',
              'Files found: 0',
              ''
            ],
            action: setting => {
              const selectedFolders = this.dialog.openFolderDialog();
              if (selectedFolders && selectedFolders.length) {
                const selectedFolderPath = selectedFolders[0];
                if (selectedFolderPath) {
                  this.onAudioScan(setting, selectedFolderPath);
                }
              }
            }
          },
          {
            name: 'Playlist Scanner',
            dataType: 'text',
            descriptions: [
              'Click here to start scanning playlists.',
              'Playlists found: 0',
              ''
            ],
            action: setting => {
              const selectedFolders = this.dialog.openFolderDialog();
              if (selectedFolders && selectedFolders.length) {
                const selectedFolderPath = selectedFolders[0];
                if (selectedFolderPath) {
                  this.onPlaylistScan(setting, selectedFolderPath);
                }
              }
            }
          },
          {
            name: 'Purge Database',
            dataType: 'text',
            descriptions: ['Deletes all data in the database and recreates the database.'],
            action: () => {
              this.loadingService.show();
              this.db.purge().then(() => {
                this.loadingService.hide();
              });
            }
          },
          {
            name: 'Tag Mapping',
            dataType: 'text',
            descriptions: ['Configure the mapping between the audio tags and the database.']
          }
        ]
      },
      {
        name: 'Debug',
        settings: [
          {
            name: 'Dev Tools',
            dataType: 'text',
            descriptions: ['Open developer tools.'],
            action: () => {
              this.dialog.openDevTools();
            }
          },
          {
            name: 'Test',
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
    // Subscribe to files
    let fileCount = 0;
    const fileScanSub = this.events.onEvent<IFileInfo>(AppEvent.ScanFile).subscribe(fileInfo => {
      fileCount++;
      setting.descriptions[1] = `Files found: ${fileCount}.`;
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
        setting.descriptions[0] = 'Scan process done.';
        if (failures.length) {
          console.log(failures);
          setting.descriptions[2] = 'File errors found: ' + failures.length;
        }
        else {
          setting.descriptions[2] = 'No errors found.';
        }
        const endTime = new Date().getTime();
        const timeSpan =  this.utility.toTimeSpan(endTime - startTime,
          [Milliseconds.Hour, Milliseconds.Minute, Milliseconds.Second]);
        this.log.info('Elapsed time: ' + this.utility.formatTimeSpan(timeSpan), timeSpan);
        setting.disabled = false;
      });
    });
  }

  public onSettingClick(setting: ISetting): void {
    if (setting.action && !setting.disabled) {
      setting.action(setting);
    }
  }

  async processAudioFiles(files: IFileInfo[], setting: ISetting): Promise<IAudioInfo[]> {
    const failures: IAudioInfo[] = [];
    let fileCount = 0;
    for (const fileInfo of files) {
      fileCount++;
      setting.descriptions[1] = `File ${fileCount} of ${files.length}.`;
      setting.descriptions[2] = fileInfo.path;
      const options = await this.db.getModuleOptions();
      const audioInfo = await this.scanner.processAudioFile(fileInfo, options);
      if (audioInfo && audioInfo.error) {
        failures.push(audioInfo);
      }
    }
    return failures;
  }

  public onPlaylistScan(setting: ISetting, folderPath: string): void {
    setting.disabled = true;
    setting.descriptions[0] = 'Scanning playlists...';
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
      setting.descriptions[1] = `Playlist ${playlistCount} created: ${playlist.name}.`;
      setting.descriptions[2] = '';
    });
    this.subs.add(playlistCreatedSub, 'settingsViewScanPlaylistCreated');
    const trackAddedSub = this.events.onEvent<PlaylistSongEntity>(AppEvent.ScanTrackAdded)
    .subscribe(track => {
      trackCount++;
      setting.descriptions[2] = `Track added: ${trackCount} - ${track.song.name} - ${track.song.duration}.`;
    });
    this.subs.add(trackAddedSub, 'settingsViewScanTrackAdded');
    // Star scan process
    this.scanner.scan(folderPath, '.m3u').then(playlistFiles => {
      this.processPlaylistFiles(playlistFiles).then(() => {
        // Process done, remove subs
        this.subs.unSubscribe('settingsViewScanPlaylistCreated');
        this.subs.unSubscribe('settingsViewScanTrackAdded');
        // Notify and enable back
        setting.descriptions[0] = 'Scan process done.';
        setting.disabled = false;
      });
    });
  }

  private async processPlaylistFiles(files: IFileInfo[]): Promise<any> {
    for (const fileInfo of files) {
      console.log('Processing ' + fileInfo.path);
      await this.scanner.processPlaylistFile(fileInfo);
    }
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

  onTest(): void {
    // const directoryPath = 'J:\\Music\\English\\Pop\\Madonna\\1983 - Madonna';
    // const directoryPath = 'E:\\Temp\\English';
    // this.fileService.getFilesAsync(directoryPath).subscribe(fileInfo => {
    //   this.metadataService.getMetadata(fileInfo).then(audioInfo => {
    //     console.log(audioInfo.metadata);
    //   });
    // });

    // this.scanner.scan('J:\\Music\\Playlists', '.m3u').then(plsFiles => {
    //   this.processPlaylistFiles(plsFiles);
    // });

    // this.sidebarHostService.loadComponent(QuickSearchComponent);
    // this.sidebarService.toggleRight();
    //const builder = this.db.getSongArtistBuilder();
    //this.db.getListFromBuilder(builder, []);
  }
}
