import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'src/app/core/services/electron/electron.service';
import { ScanService } from 'src/app/shared/services/scan/scan.service';

@Component({
  selector: 'sp-settings-view',
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.scss']
})
export class SettingsViewComponent implements OnInit {

  constructor(
    private electron: ElectronService,
    private scanner: ScanService) { }

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
}
