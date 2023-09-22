import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppEvent } from '../../models/events.enum';
import { FileService } from '../../../platform/file/file.service';
import { IScanItemInfo, ISyncSongInfo } from './scan.interface';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { ScanAudioService } from './scan-audio.service';
import { ScanPlaylistsService } from './scan-playlists.service';
import { IProcessDuration } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlaylistEntity, PlaylistSongEntity } from '../../entities';
import { MetaField } from 'src/app/mapping/data-transform/data-transform.enum';
import { PeriodTimer } from 'src/app/core/models/timer.class';

/**
 * Services for scanning files.
 */
@Injectable({
  providedIn: 'root'
})
export class ScanService {
  constructor(
    private fileService: FileService,
    private scanAudioService: ScanAudioService,
    private playlistScanService: ScanPlaylistsService,
    private utility: UtilityService,
    private events: EventsService)
  { }

  /**
   * Scans files in the specified directories.
   */
  run(folderPaths: string[], extension: string, scanId?: string): Promise<IProcessDuration<IFileInfo[]>> {
    const t = new PeriodTimer(this.utility);
    return new Promise(resolve => {
      let fileCount = 0;
      const result: IFileInfo[] = [];
      this.fileService.getFiles(folderPaths).subscribe({
        next: fileInfo => {
          if (fileInfo.extension.toLowerCase() === extension.toLowerCase()) {
            const existingFile = result.find(f => f.path === fileInfo.path);
            if (!existingFile) {
              fileCount++;
              result.push(fileInfo);
              const info: IScanItemInfo<IFileInfo> = { progress: fileCount, item: fileInfo, scanId: scanId };
              this.events.broadcast(AppEvent.ScanFile, info);
            }
          }
        },
        complete: () => {
          resolve({ period: t.stop(), result: result });
        }
      });
    });
  }

  public async syncAudioFiles(files: IFileInfo[]): Promise<IProcessDuration<ISyncSongInfo>> {
    const t = new PeriodTimer(this.utility);
    const result = await this.scanAudioService.beforeProcess();
    let fileCount = 0;
    for (const file of files) {
      fileCount++;
      const info: IScanItemInfo<IFileInfo> = { progress: fileCount, item: file, total: files.length };
      this.events.broadcast(AppEvent.ScanAudioFileStart, info);
      this.scanAudioService.setMode(file);
      const metadata = await this.scanAudioService.processAudioFile(file);
      const ignoredData = metadata[MetaField.Ignored];
      if (ignoredData?.length && ignoredData[0]) {
        result.ignoredFiles.push(file.path);
      }
      result.metadataResults.push(metadata);
    }

    this.events.broadcast(AppEvent.ScanAudioDbSyncStart);
    await this.scanAudioService.syncChangesToDatabase(result);

    this.events.broadcast(AppEvent.ScanAudioDbCleanupStart);
    await this.scanAudioService.cleanUpDatabase(result);
    result.songFinalCount = result.songAddedRecords.length + result.songUpdatedRecords.length + result.songSkippedRecords.length - result.songDeletedRecords.length;
    this.scanAudioService.cleanUpMemory();

    return { period: t.stop(), result: result };
  }

  public async syncPlaylistFiles(files: IFileInfo[]): Promise<IProcessDuration<any>> {
    const t = new PeriodTimer(this.utility);
    let playlistCount = 0;
    for (const fileInfo of files) {
      await this.playlistScanService.processPlaylistFile(fileInfo,
        playlist => {
          playlistCount++;
          const info: IScanItemInfo<PlaylistEntity> = { progress: playlistCount, item: playlist, total: files.length };
          this.events.broadcast(AppEvent.ScanPlaylistCreated, info);
        },
        track => {
          const info: IScanItemInfo<PlaylistSongEntity> = { progress: track.sequence, item: track };
          this.events.broadcast(AppEvent.ScanTrackAdded, info);
        });
    }
    return { period: t.stop(), result: null };
  }
}
