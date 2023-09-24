import { Injectable } from '@angular/core';
import { ISyncProfileParsed } from 'src/app/shared/models/sync-profile-model.interface';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { IExportConfig, IPlaylistExportConfig } from 'src/app/shared/services/export/export.interface';
import { KeyValues } from 'src/app/core/models/core.interface';
import { IDataSourceParsed, IDataSourceService } from '../data-source/data-source.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { FileService } from 'src/app/platform/file/file.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

@Injectable({
  providedIn: 'root'
})
export class PlaylistWriterService extends DataTransformServiceBase<IExportConfig, ISongModel, boolean> {
  private rootPath: string;
  /** Current input configuration from the process method. */
  private config: IPlaylistExportConfig;
  constructor(
    private fileService: FileService,
    private utility: UtilityService) {
    super()
  }

  public async init(profile: ISyncProfileParsed, inputSources: IDataSourceParsed[]): Promise<void> {
    this.rootPath = profile.directories[0];
  }

  public async run(input: IExportConfig): Promise<boolean> {
    this.config = input.playlistConfig;
    // Setup defaults
    this.config.minCount = this.config.minCount ? this.config.minCount : 10;
    this.config.maxCount = this.config.maxCount ? this.config.maxCount : 1000;
    // Do not go any further if we don't have enough items
    if (input.songs.length < this.config.minCount) {
      return false;
    }
    // Prepare directory path if needed
    if (!this.config.path) {
      this.config.path = this.rootPath;
      if (this.config.directory) {
        this.config.path = this.fileService.combine(this.config.path, this.config.directory);
        await this.fileService.createDirectory(this.config.path);
      }
    }
    // Prepare file name
    let fileName: string;
    if (input.criteria?.name) {
      if (input.playlistConfig?.prefix) {
        const separator = input.playlistConfig.nameSeparator ? input.playlistConfig.nameSeparator : '';
        fileName = `${input.playlistConfig?.prefix}${separator} ${input.criteria?.name}`;
      }
      else {
        fileName = input.criteria.name;
      }
    }
    else {
      fileName = `Playlist ` + this.utility.toDateTimeStamp(new Date());
    }

    // Prepare playlist file path
    const format = this.config.format.toLowerCase();
    const extension = '.' + format;
    const filePath = this.fileService.combine(this.config.path, fileName + extension);

    if (this.fileService.exists(filePath)) {
      return false;
    }

    // TODO: use getData and mappings to setup playlist info
    let fileLines: string[];
    const slicedSongs = input.songs.slice(0, this.config.maxCount);
    if (format === 'pls') {
      fileLines = this.createPls(slicedSongs);
    }
    else if (format === 'm3u') {
      fileLines = this.createM3u(slicedSongs);
    }

    if (!fileLines.length) {
      return false;
    }

    await this.fileService.writeText(filePath, fileLines.join('\n'));
    return true;
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
    song.filePath = this.config.fileMappings[song.filePath];
    if (this.config.absolutePathEnabled) {
      return song.filePath;
    }
    return this.fileService.getRelativePath(this.config.path, song.filePath);
  }
}
