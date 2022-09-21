import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'src/app/core/services/electron/electron.service';
import { FileService } from 'src/app/shared/services/file/file.service';

@Component({
  selector: 'sp-settings-view',
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.scss']
})
export class SettingsViewComponent implements OnInit {

  constructor(private electron: ElectronService, private fileService: FileService) { }

  ngOnInit(): void {
  }

  onScan(): void {
    const selectedFolders = this.electron.openFolderDialog();
    if (selectedFolders && selectedFolders.length) {
      const selectedFolderPath = selectedFolders[0];

      this.fileService.getFilesAsync(selectedFolderPath).subscribe(filePath => {
        console.log(filePath);
      });
    }
  }
}
