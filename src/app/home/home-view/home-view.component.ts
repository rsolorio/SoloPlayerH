import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'src/app/core/services/electron/electron.service';
import * as musicMetadata from 'music-metadata-browser';

@Component({
  selector: 'sp-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
})
export class HomeViewComponent implements OnInit {

  constructor(public electronService: ElectronService) { }

  ngOnInit(): void {
  }

  public onTest(): void {
    // this.electronService.openDevTools();
    // this.electronService.openFolderDialog({ title: 'Hello Dialog!' }).then(result => {
    //   console.log(result);
    // });

    const path = 'J:\\Music\\English\\Pop\\Madonna\\1983 - Madonna\\01 - 01 - lucky star.mp3';
    const url = 'file://' + path;
    musicMetadata.fetchFromUrl(url).then(metadata => {
      console.log(metadata);
      const tagType = metadata.format.tagTypes[0];
      const tags = metadata.native[tagType];
      console.log(tags);
    });

    // const db = new sqlite3.Database('solo-player-db.db');
    // db.serialize(() => {
    //   db.run('CREATE TABLE if not exists lorem (info TEXT)');
    // });
  }
}
