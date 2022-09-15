import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'src/app/core/services/electron/electron.service';
import * as fs from 'fs';
import * as path from 'path';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
import { Song } from 'src/app/shared/models/song.entity';

@Component({
  selector: 'sp-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
})
export class HomeViewComponent implements OnInit {

  constructor(public electronService: ElectronService, public metadataService: MusicMetadataService) { }

  ngOnInit(): void {
  }

  public onTest1(): void {
    this.logMetadata();
  }

  public async logMetadata(): Promise<void> {
    const selectedFolders = this.electronService.openFolderDialog();
    const directoryPath = selectedFolders[0];
    console.log(directoryPath);
    const folderItems = fs.readdirSync(directoryPath);
    for (const folderItem of folderItems) {
      const itemPath = path.join(directoryPath, folderItem);
      if (fs.statSync(itemPath).isDirectory()) {
        console.log('Directory: ' + itemPath);
      }
      else if (folderItem.toLowerCase().endsWith('.mp3')) {
        const metadata = await this.metadataService.getMetadata(itemPath);
        console.log(folderItem);
        console.log(metadata);
        const s = new Song();
        s.id = this.metadataService.getId3v24Identifier(metadata);
        s.albumId = metadata.common.album;
        s.name = metadata.common.title;
        s.releaseYear = metadata.common.year;
        s.releaseDecade = 1990;
        s.filePath = itemPath;
        s.save();
      }
      else {
        console.log('File: ' + folderItem);
      }
    }
  }

  public onTest2(): void {
    this.electronService.openDevTools();
  }
}
