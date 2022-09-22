import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'src/app/core/services/electron/electron.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { Song } from 'src/app/shared/models/song.entity';
import { FileService } from 'src/app/shared/services/file/file.service';
import { IIdentifierTag, ILyricsTag } from 'src/app/shared/services/music-metadata/music-metadata.interface';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';

@Component({
  selector: 'sp-settings-view',
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.scss']
})
export class SettingsViewComponent implements OnInit {

  constructor(
    private electron: ElectronService,
    private fileService: FileService,
    private metadataService: MusicMetadataService,
    private utilities: UtilityService) { }

  ngOnInit(): void {
  }

  onScan(): void {
    const selectedFolders = this.electron.openFolderDialog();
    if (selectedFolders && selectedFolders.length) {
      const selectedFolderPath = selectedFolders[0];
      this.scan(selectedFolderPath).then(() => {
        console.log('Done Done Done');
      });
    }
  }

  scan(selectedFolderPath: string): Promise<void> {
    return new Promise(resolve => {
      const files: string[] = [];
      this.fileService.getFilesAsync(selectedFolderPath).subscribe({
        next: filePath => {
          files.push(filePath);
          console.log(filePath);
        },
        complete: async () => {
          console.log(files.length);
          for (const filePath of files) {
            await this.processFile(filePath);
          }
          console.log('Done Done');
          resolve();
        }
      });
    });
  }

  async processFile(filePath: string): Promise<void> {
    const fileMetadata = await this.metadataService.getMetadata(filePath, true);
    const song = new Song();
    const id = this.metadataService.getId3v24Tag<IIdentifierTag>('UFID', fileMetadata);
    song.id = id.identifier.toString();
    song.filePath = filePath;
    song.name = fileMetadata.common.title;
    song.albumId = '';
    song.trackNumber = fileMetadata.common.track.no;
    song.mediaNumber = fileMetadata.common.disk.no;
    song.releaseYear = fileMetadata.common.year;
    if (!song.releaseYear || song.releaseYear === 1900) {
      song.releaseDecade = 0;
    }
    else {
      song.releaseDecade = this.utilities.getDecade(song.releaseYear);
    }
    if (fileMetadata.common.composer && fileMetadata.common.composer.length) {
      song.composer = fileMetadata.common.composer[0];
    }
    const addDate = this.metadataService.getId3v24Tag<string>('TXXX:TDAT', fileMetadata);
    if (addDate) {
      song.addDate = new Date(addDate);
    }
    song.language = this.metadataService.getId3v24Tag<string>('TXXX:TLAN', fileMetadata);
    song.mood = this.metadataService.getId3v24Tag<string>('TXXX:TMOO', fileMetadata);
    song.playCount = parseInt(this.metadataService.getId3v24Tag<string>('TXXX:PLAYCOUNT', fileMetadata), 10);
    song.rating = parseInt(this.metadataService.getId3v24Tag<string>('TXXX:RATING', fileMetadata), 10);
    song.vbr = fileMetadata.format.codecProfile !== 'CBR';
    if (fileMetadata.format.duration) {
      song.seconds = fileMetadata.format.duration;
      song.duration = this.utilities.secondsToMinutes(song.seconds);
    }
    else {
      console.log(fileMetadata);
    }
    song.bitrate = fileMetadata.format.bitrate;
    song.replayGain = fileMetadata.format.trackGain;

    const lyrics = this.metadataService.getId3v24Tag<ILyricsTag>('USLT', fileMetadata);
    if (lyrics) {
      song.lyrics = lyrics.text;
    }

    await song.save();
    console.log('Done: ' + song.id);
  }
}
