import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'src/app/core/services/electron/electron.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { FileService } from 'src/app/shared/services/file/file.service';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
import { ScanService } from 'src/app/shared/services/scan/scan.service';

@Component({
  selector: 'sp-settings-view',
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.scss']
})
export class SettingsViewComponent implements OnInit {

  constructor(
    private electron: ElectronService,
    private scanner: ScanService,
    private db: DatabaseService,
    private metadataService: MusicMetadataService,
    private fileService: FileService) { }

  ngOnInit(): void {
  }

  onScan(): void {
    const selectedFolders = this.electron.openFolderDialog();
    if (selectedFolders && selectedFolders.length) {
      const selectedFolderPath = selectedFolders[0];
      this.scanner.scan(selectedFolderPath).then(() => {
        console.log('Done Done Done');
      });
    }
  }

  onTest(): void {
    this.fileService.getFilesAsync('J:\\Music\\English\\Pop\\Madonna\\1983 - Madonna').subscribe(fileInfo => {
      this.metadataService.getMetadata(fileInfo).then(audioInfo => {
        console.log(audioInfo.metadata.common.picture[0]);
      });
    });
  }
}
