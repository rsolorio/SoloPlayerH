import { Injectable } from '@angular/core';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { FileService } from 'src/app/platform/file/file.service';
import { PlaylistEntity, PlaylistSongEntity, SongEntity } from '../../entities';
import { DatabaseLookupService } from '../database/database-lookup.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ValueLists } from '../database/database.lists';
import { EventsService } from 'src/app/core/services/events/events.service';
import { DatabaseService } from '../database/database.service';
import { AppEvent } from '../../models/events.enum';
import { LogService } from 'src/app/core/services/log/log.service';

@Injectable({
  providedIn: 'root'
})
export class ScanPlaylistsService {

  constructor(
    private fileService: FileService,
    private lookupService: DatabaseLookupService,
    private utilities: UtilityService,
    private events: EventsService,
    private db: DatabaseService,
    private log: LogService)
  { }

  public async processPlaylistFile(fileInfo: IFileInfo): Promise<void> {
    const fileContent = await this.fileService.getText(fileInfo.path);
    // Remove \r and then split by \n
    const fileLines = fileContent.replace(/(\r)/gm, '').split('\n');
    if (fileLines.length) {
      let tracks: PlaylistSongEntity[];
      const firstLine = fileLines[0].toUpperCase();
      const existingPlaylist = await this.lookupService.lookupPlaylist(fileInfo.name);
      if (existingPlaylist) {
        return;
      }

      if (firstLine === '[PLAYLIST]') {
          const playlist = await this.createPlaylist(fileInfo.name);
          tracks = await this.processPls(playlist, fileInfo, fileLines);
      } else if (firstLine === '#EXTM3U') {
        const playlist = await this.createPlaylist(fileInfo.name);
        tracks = await this.processM3u(playlist, fileInfo, fileLines);
      }

      if (tracks && tracks.length) {
        this.db.bulkInsert(PlaylistSongEntity, tracks);
      }
    }
  }

  private async createPlaylist(name: string): Promise<PlaylistEntity> {
    const playlist = new PlaylistEntity();
    playlist.id = this.utilities.newGuid();
    playlist.name = name;
    playlist.favorite = false;
    playlist.imported = true;
    playlist.groupId = ValueLists.PlaylistGroup.entries.Default;
    playlist.changeDate = new Date();
    playlist.hash = this.lookupService.hashPlaylist(playlist.name);
    await playlist.save();
    this.events.broadcast(AppEvent.ScanPlaylistCreated, playlist);
    return playlist;
  }

  private async processPls(playlist: PlaylistEntity, playlistFileInfo: IFileInfo, lines: string[]): Promise<PlaylistSongEntity[]> {
    const tracks: PlaylistSongEntity[] = [];
    let trackSequence = 1;
    for (const line of lines) {
      if (line.toLowerCase().startsWith('file')) {
        const lineParts = line.split('=');
        if (lineParts.length > 1) {
          // TODO: validate proper audio extension
          const relativeFilePath = lineParts[1];
          const playlistSong = await this.createPlaylistSong(playlist, playlistFileInfo.directoryPath, relativeFilePath, trackSequence);
          if (playlistSong) {
            trackSequence++;
            tracks.push(playlistSong);
            this.events.broadcast(AppEvent.ScanTrackAdded, playlistSong);
          }
        }
      }
    }
    return tracks;
  }

  private async processM3u(playlist: PlaylistEntity, fileInfo: IFileInfo, lines: string[]): Promise<PlaylistSongEntity[]> {
    const tracks: PlaylistSongEntity[] = [];
    let trackSequence = 1;
    for (const line of lines) {
      const lineLowerCase = line.toLowerCase();
      if (!lineLowerCase.startsWith('#extinf') && !line.startsWith('#extm3u') && line.endsWith('.mp3')) {
        const playlistSong = await this.createPlaylistSong(playlist, fileInfo.directoryPath, line, trackSequence);
        if (playlistSong) {
          trackSequence++;
          tracks.push(playlistSong);
          this.events.broadcast(AppEvent.ScanTrackAdded, playlistSong);
        }
      }
    }
    return tracks;
  }

  private async createPlaylistSong(playlist: PlaylistEntity, playlistDirectoryPath: string, relativeFilePath: string, sequence: number): Promise<PlaylistSongEntity> {
    const audioFilePath = this.fileService.getAbsolutePath(playlistDirectoryPath, relativeFilePath);
    const song = await SongEntity.findOneBy({ filePath: audioFilePath });
    if (song) {
      const playlistSong = new PlaylistSongEntity();
      playlistSong.playlist = playlist;
      playlistSong.song = song;
      playlistSong.sequence = sequence;
      return playlistSong;
    }
    this.log.warn('Playlist audio file not found.', audioFilePath);
    return null;
  }
}
