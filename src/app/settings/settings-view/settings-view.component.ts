import { Component, OnInit } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { ElectronService } from 'src/app/core/services/electron/electron.service';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IFileInfo } from 'src/app/shared/services/file/file.interface';
import { FileService } from 'src/app/shared/services/file/file.service';
import { IAudioInfo } from 'src/app/shared/services/music-metadata/music-metadata.interface';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
import { ScanService } from 'src/app/shared/services/scan/scan.service';

@Component({
  selector: 'sp-settings-view',
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.scss']
})
export class SettingsViewComponent extends CoreComponent implements OnInit {

  constructor(
    private electron: ElectronService,
    private scanner: ScanService,
    private metadataService: MusicMetadataService,
    private fileService: FileService,
    private events: EventsService) {
      super();
    }

  ngOnInit(): void {
    this.subs.sink = this.events.onEvent<IFileInfo>(AppEvent.ScanFile).subscribe(fileInfo => {
      console.log(fileInfo.path);
    });
  }

  onScan(): void {
    const selectedFolders = this.electron.openFolderDialog();
    if (selectedFolders && selectedFolders.length) {
      const selectedFolderPath = selectedFolders[0];
      this.scanner.scan(selectedFolderPath).then(files => {
        console.log(files.length);
        this.processFiles(files).then(failures => {
          if (failures.length) {
            console.log(failures);
          }
          console.log('Done');
        });
      });
    }
  }

  async processFiles(files: IFileInfo[]): Promise<IAudioInfo[]> {
    const failures: IAudioInfo[] = [];
    let fileCount = 0;
    for (const fileInfo of files) {
      fileCount++;
      console.log(`${fileCount} of ${files.length}`);
      const audioInfo = await this.scanner.processFile(fileInfo);
      if (audioInfo && audioInfo.error) {
        failures.push(audioInfo);
      }
    }
    return failures;
  }

  onTest(): void {
    // const directoryPath = 'J:\\Music\\English\\Pop\\Madonna\\1983 - Madonna';
    const directoryPath = 'E:\\Temp\\English';
    this.fileService.getFilesAsync(directoryPath).subscribe(fileInfo => {
      this.metadataService.getMetadata(fileInfo).then(audioInfo => {
        console.log(audioInfo.metadata);
      });
    });
  }
}
