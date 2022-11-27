import { Component, OnInit } from '@angular/core';
import { DefaultImageSrc } from 'src/app/core/globals.enum';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { ElectronService } from 'src/app/core/services/electron/electron.service';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
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
    private electron: ElectronService,
    private scanner: ScanService,
    private metadataService: MusicMetadataService,
    private fileService: FileService,
    private events: EventsService) {
      super();
    }

  ngOnInit(): void {
    this.initializeSettings();
    this.subs.sink = this.events.onEvent<IFileInfo>(AppEvent.ScanFile).subscribe(fileInfo => {
      console.log(fileInfo.path);
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
            name: 'Media Scanner',
            dataType: 'text',
            descriptions: ['Start scanning files.'],
            action: setting => {
              setting.dynamicText = 'J:\\Music\\English\\Country\\Alan Jackson\\1992 - A Lot About Livin (And A Little Bout Love)\\01 - 01 - chattahoochee.mp3';
            }
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
              this.electron.openDevTools();
            }
          }
        ]
      }
    ];
  }

  onScan(): void {
    const selectedFolders = this.electron.openFolderDialog();
    if (selectedFolders && selectedFolders.length) {
      const selectedFolderPath = selectedFolders[0];
      this.scanner.scan(selectedFolderPath, '.mp3').then(mp3Files => {
        console.log(mp3Files.length);
        this.processAudioFiles(mp3Files).then(failures => {
          if (failures.length) {
            console.log(failures);
          }
          console.log('Done');
        });
      });
    }
  }

  public onSettingClick(setting: ISetting): void {
    if (setting.action) {
      setting.action(setting);
    }
  }

  async processAudioFiles(files: IFileInfo[]): Promise<IAudioInfo[]> {
    const failures: IAudioInfo[] = [];
    let fileCount = 0;
    for (const fileInfo of files) {
      fileCount++;
      console.log(`${fileCount} of ${files.length}`);
      const audioInfo = await this.scanner.processAudioFile(fileInfo);
      if (audioInfo && audioInfo.error) {
        failures.push(audioInfo);
      }
    }
    return failures;
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

    this.transitionSrc = '../assets/img/front.jpg';
  }

  async processPlaylistFiles(files: IFileInfo[]): Promise<any> {
    for (const fileInfo of files) {
      console.log('Processing ' + fileInfo.path);
      await this.scanner.processPlaylistFile(fileInfo);
    }
  }

  public onOpenDevTools(): void {
    this.electron.openDevTools();
  }
}
