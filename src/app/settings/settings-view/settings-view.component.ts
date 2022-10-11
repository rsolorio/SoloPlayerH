import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'src/app/core/services/electron/electron.service';
import { ArtistEntity } from 'src/app/shared/entities';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
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
    private db: DatabaseService) { }

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
    // this.db.getSongsWithGenre('Pop').then(result => {
    //   console.log(result);
    // });
    const artist = new ArtistEntity();
    artist.name = 'Norah Jones';
    this.db.hashArtist(artist);
    // this.db.getSongsFromAlbumArtist(artist.id).then(result => {
    //   console.log(result);
    // });
    // this.db.getSongsFromArtist(artist.id).then(result => {
    //   console.log(result);
    // });
  }
}
