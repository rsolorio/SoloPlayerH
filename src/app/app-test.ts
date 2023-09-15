import { Injectable } from "@angular/core";
import { Criteria } from "./shared/services/criteria/criteria.class";
import { CriteriaSortDirection } from "./shared/services/criteria/criteria.enum";
import { SyncProfileId } from "./shared/services/database/database.seed";
import { IExportConfig } from "./shared/services/export/export.interface";
import { ExportService } from "./shared/services/export/export.service";
import { DialogService } from "./platform/dialog/dialog.service";
import { FileService } from "./platform/file/file.service";
import { AudioMetadataService } from "./platform/audio-metadata/audio-metadata.service";
import { LogService } from "./core/services/log/log.service";
import { MimeType } from "./core/models/core.enum";

/**
 * This is a service for testing purposes only.
 * It doesn't have any special functionality and it will be eventually removed.
 */
@Injectable({
  providedIn: 'root'
})
export class AppTestService {
  constructor(
    private log: LogService,
    private exporter: ExportService,
    private dialog: DialogService,
    private fileService: FileService,
    private metadataService: AudioMetadataService) {}

  public async test(): Promise<void> {
    //await this.logFileMetadata();
    await this.testExporter();
  }

  private testExporter(): void {
    const criteria = new Criteria();
    criteria.paging.pageSize = 500;
    criteria.addSorting('addDate', CriteriaSortDirection.Descending);
    const config: IExportConfig = {
      profileId: SyncProfileId.DefaultExport,
      directories: ['J:\\Test'],
      playlistConfig: {
        format: 'm3u',
        directory: 'Playlists',
        nameSeparator: '›'
      }
    };
    this.exporter.run(config).then(() => {
      console.log('done');
    });
  }

  private async logFileMetadata(): Promise<void> {
    const selectedFiles = this.dialog.openFileDialog();
    if (selectedFiles && selectedFiles.length) {
      const fileInfo = await this.fileService.getFileInfo(selectedFiles[0]);
      const buffer = await this.fileService.getBuffer(fileInfo.path);
      const audioInfo = await this.metadataService.getMetadata(buffer, MimeType.Mp3, true);
      // As warning to bypass the default log config
      this.log.warn('File info.', fileInfo);
      this.log.warn('Audio info.', audioInfo);
    }
  }
}