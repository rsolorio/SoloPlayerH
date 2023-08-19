import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppEvent } from '../../models/events.enum';
import { FileService } from '../../../platform/file/file.service';
import { IScanInfo, ISyncSongInfo } from './scan.interface';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { ScanAudioService } from './scan-audio.service';
import { ScanPlaylistsService } from './scan-playlists.service';

/**
 * Services for scanning files.
 */
@Injectable({
  providedIn: 'root'
})
export class ScanService {
  private audioSyncRunning = false;
  private playlistProcessRunning = false;

  constructor(
    private fileService: FileService,
    private scanAudioService: ScanAudioService,
    private playlistScanService: ScanPlaylistsService,
    private events: EventsService)
  { }

  /**
   * Scans files in the specified directories.
   */
  scan(folderPaths: string[], extension: string): Promise<IScanInfo> {
    return new Promise(resolve => {
      const info: IScanInfo = {
        fileCountProgress: 0,
        items: []
      };
      this.fileService.getFiles(folderPaths).subscribe({
        next: fileInfo => {
          if (fileInfo.extension.toLowerCase() === extension.toLowerCase()) {
            const existingFile = info.items.find(f => f.path === fileInfo.path);
            if (!existingFile) {
              info.fileCountProgress++;
              info.items.push(fileInfo);
              this.events.broadcast(AppEvent.ScanFile, info);
            }
          }
        },
        complete: () => {
          resolve(info);
        }
      });
    });
  }

  public async syncAudioFiles(
    files: IFileInfo[],
    beforeFileProcess?: (count: number, fileInfo: IFileInfo) => Promise<void>,
    beforeSyncChanges?: () => Promise<void>,
    beforeCleanup?: () => Promise<void>
  ): Promise<ISyncSongInfo> {
    const result = await this.scanAudioService.beforeProcess();
    let fileCount = 0;
    for (const file of files) {
      fileCount++;
      if (beforeFileProcess) {
        await beforeFileProcess(fileCount, file);
      }
      this.scanAudioService.setMode(file);
      const metadata = await this.scanAudioService.processAudioFile(file);
      result.metadataResults.push(metadata);
    }

    if (beforeSyncChanges) {
      await beforeSyncChanges();
    }
    await this.scanAudioService.syncChangesToDatabase(result);

    if (beforeCleanup) {
      await beforeCleanup();
    }
    await this.scanAudioService.cleanUpDatabase(result);
    result.songFinalCount = result.songAddedRecords.length + result.songUpdatedRecords.length + result.songSkippedRecords.length - result.songDeletedRecords.length;
    this.scanAudioService.cleanUpMemory();
    return result;
  }

  public async processPlaylistFiles(files: IFileInfo[]): Promise<any> {
    for (const fileInfo of files) {
      await this.playlistScanService.processPlaylistFile(fileInfo);
    }
  }
}
