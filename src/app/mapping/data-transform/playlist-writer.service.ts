import { Injectable } from '@angular/core';
import { ISyncProfileParsed } from 'src/app/shared/models/sync-profile-model.interface';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { IExportConfig } from 'src/app/shared/services/export/export.interface';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { KeyValues } from 'src/app/core/models/core.interface';
import { IDataSourceService } from '../data-source/data-source.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { FileService } from 'src/app/platform/file/file.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

@Injectable({
  providedIn: 'root'
})
export class PlaylistWriterService extends DataTransformServiceBase<IExportConfig, ISongModel, any> {
  private playlistDirectoryPath: string;
  /** Configuration that comes from the exporter service. */
  private config: IExportConfig;
  constructor(
    private entities: DatabaseEntitiesService,
    private fileService: FileService,
    private utility: UtilityService) {
    super(entities)
  }

  public async init(profile: ISyncProfileParsed): Promise<void> {
    this.config = profile.config;
    // Prepare directory path
    this.playlistDirectoryPath = profile.directories[0];
    if (this.config.playlistConfig.playlistDirectory) {
      this.playlistDirectoryPath = this.playlistDirectoryPath.endsWith('\\') ? this.playlistDirectoryPath : this.playlistDirectoryPath + '\\';
      this.playlistDirectoryPath += this.config.playlistConfig.playlistDirectory;
      this.fileService.createDirectory(this.playlistDirectoryPath);
    }
    this.playlistDirectoryPath = this.playlistDirectoryPath.endsWith('\\') ? this.playlistDirectoryPath : this.playlistDirectoryPath + '\\';
  }

  public async process(input: IExportConfig): Promise<void> {
    // Prepare file name
    let fileName: string;
    if (input.criteria?.name) {
      fileName = input.criteria.name;
    }
    else {
      fileName = `Playlist ` + this.utility.toDateTimeStamp(new Date());
    }

    // Prepare file path
    const format = this.config.playlistConfig.playlistFormat.toLowerCase();
    const extension = '.' + format;
    const filePath = this.playlistDirectoryPath + fileName + extension;

    // TODO: use getData and mappings to setup playlist info
    let fileLines: string[];
    if (format === 'pls') {
      fileLines = this.createPls(input.songs);
    }
    else if (format === 'm3u') {
      fileLines = this.createM3u(input.songs);
    }

    if (fileLines.length) {
      await this.fileService.writeText(filePath, fileLines.join('\n'));
    }
  }

  protected getData(input: ISongModel): Promise<KeyValues> {
    return null 
  }
  
  protected getService(dataSourceType: string): IDataSourceService {
    return null;
  }

  private createPls(songs: ISongModel[]): string[] {
    const result: string[] = [];
    // Before process
    result.push('[playlist]');
    // Process
    let songCount = 0;
    for (const song of songs) {
      // Append data
      songCount++;
      result.push(`File${songCount}=${this.resolvePath(song)}`);
      // This entry is optional
      result.push(`Title${songCount}=${song.name}`);
      result.push(`Length${songCount}=${song.seconds}`);
    }
    // After process
    result.push('NumberOfEntries=' + songs.length);
    result.push('Version=2');
    return result;
  }

  private createM3u(songs: ISongModel[]): string[] {
    const result: string[] = [];
    // Before process
    result.push('#EXTM3U');
    // Process
    for (const song of songs) {
      // Append data
      result.push(`#EXTINF:${song.seconds},${song.primaryArtistName} - ${song.name}`);
      result.push(this.resolvePath(song));
    }
    return result;
  }

  private resolvePath(song: ISongModel): string {
    // Replace the source path with the destination path
    song.filePath = this.config.playlistConfig.fileMappings[song.filePath];
    if (this.config.playlistConfig.playlistAbsolutePath) {
      return song.filePath;
    }
    return this.fileService.getRelativePath(this.playlistDirectoryPath, song.filePath);
  }
}
