import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ArtistEntity, AlbumEntity, ClassificationEntity, SongEntity, PlaylistEntity, PlaylistSongEntity } from '../../entities';
import { AppEvent } from '../../models/events.enum';
import { DatabaseService } from '../database/database.service';
import { IFileInfo } from '../file/file.interface';
import { FileService } from '../file/file.service';
import { IAudioInfo, IIdentifierTag, IPopularimeterTag } from '../music-metadata/music-metadata.interface';
import { MusicMetadataService } from '../music-metadata/music-metadata.service';

@Injectable({
  providedIn: 'root'
})
export class ScanService {

  private unknownValue = 'Unknown';

  constructor(
    private fileService: FileService,
    private metadataService: MusicMetadataService,
    private utilities: UtilityService,
    private db: DatabaseService,
    private events: EventsService,
    private log: LogService) { }

  scan(folderPath: string, extension: string): Promise<IFileInfo[]> {
    return new Promise(resolve => {
      const files: IFileInfo[] = [];
      this.fileService.getFilesAsync(folderPath).subscribe({
        next: fileInfo => {
          if (fileInfo.extension.toLowerCase() == extension.toLowerCase()) {
            files.push(fileInfo);
            this.events.broadcast(AppEvent.ScanFile, fileInfo);
          }
        },
        complete: () => {
          resolve(files);
        }
      });
    });
  }

  public async processAudioFile(fileInfo: IFileInfo): Promise<IAudioInfo> {
    const buffer = await this.fileService.getBuffer(fileInfo.path);
    const audioInfo = await this.metadataService.getMetadata(buffer, true);
    if (!audioInfo || audioInfo.error) {
      return audioInfo;
    }

    // PRIMARY ALBUM ARTIST
    const primaryArtist = this.processAlbumArtist(audioInfo);
    const existingArtist = await ArtistEntity.findOneBy({ id: primaryArtist.id });
    if (existingArtist) {
      // Only update if the existing artist has empty fields
      let needsUpdate = !existingArtist.artistType && primaryArtist.artistType;
      if (!needsUpdate) {
        needsUpdate = !existingArtist.country && primaryArtist.country;
      }
      if (needsUpdate) {
        await primaryArtist.save();
      }
    }
    else {
      await primaryArtist.save();
    }

    // MULTIPLE ARTISTS
    const artists = this.processArtists(audioInfo);
    for (const artist of artists) {
      // Skip the primary artist because it has been already added or updated in the previous step
      if (artist.name !== primaryArtist.name) {
        // Only add if it does not exist, otherwise it will update an existing record
        // and wipe out other fields
        await this.db.add(artist, ArtistEntity);
      }
    }

    // PRIMARY ALBUM
    const primaryAlbum = this.processAlbum(primaryArtist, audioInfo);
    await this.db.add(primaryAlbum, AlbumEntity);

    // GENRES
    // TODO: add default genre if no one found
    const genres = this.processGenres(audioInfo);
    for (const genre of genres) {
      await this.db.add(genre, ClassificationEntity);
    }

    // CLASSIFICATIONS
    const classifications = this.processClassifications(audioInfo);
    for (const classification of classifications) {
      await this.db.add(classification, ClassificationEntity);
    }

    // SONG - ARTISTS/GENRES/CLASSIFICATIONS
    const song = this.processSong(primaryAlbum, audioInfo, fileInfo);
    // Make sure the primary artist is part of the song artists
    if (!artists.find(a => a.id === primaryArtist.id)) {
      artists.push(primaryArtist);
    }
    // Song artists (this info will be saved in the songArtist table)
    song.artists = artists;
    // Genres and classifications
    song.classifications = [...genres, ...classifications];
    // TODO: if the song already exists, update data
    await this.db.add(song, SongEntity);

    return audioInfo;
  }

  private processAlbumArtist(audioInfo: IAudioInfo): ArtistEntity {
    const artist = new ArtistEntity();

    artist.name = this.unknownValue;
    if (audioInfo.metadata.common.albumartist) {
      artist.name = audioInfo.metadata.common.albumartist;
    }
    else if (audioInfo.metadata.common.artists && audioInfo.metadata.common.artists.length) {
      artist.name = audioInfo.metadata.common.artists[0];
    }

    if (audioInfo.metadata.common.albumartistsort) {
      artist.artistSort = audioInfo.metadata.common.albumartistsort;
    }
    else {
      artist.artistSort = artist.name;
    }
    artist.favorite = false;

    const id3v2Tags = this.metadataService.getId3v24Tags(audioInfo.metadata);
    const artistType = this.metadataService.getTag<string>('ArtistType', id3v2Tags, true);
    artist.artistType = artistType ? artistType : this.unknownValue;

    const country = this.metadataService.getTag<string>('Country', id3v2Tags, true);
    artist.country = country ? country : this.unknownValue;

    this.db.hashArtist(artist);
    return artist;
  }

  private processAlbum(artist: ArtistEntity, audioInfo: IAudioInfo): AlbumEntity {
    const album = new AlbumEntity();

    album.primaryArtist = artist;

    album.name = this.unknownValue;
    if (audioInfo.metadata.common.album) {
      album.name = audioInfo.metadata.common.album;
    }

    album.releaseYear = 0;
    if (audioInfo.metadata.common.year) {
      // Hack for SoloSoft: ignore 1900
      if (audioInfo.metadata.common.year !== 1900) {
        album.releaseYear = audioInfo.metadata.common.year;
      }
    }

    if (audioInfo.metadata.common.albumsort) {
      album.albumSort = audioInfo.metadata.common.albumsort;
    }
    else {
      album.albumSort = album.name;
    }

    const id3v2Tags = this.metadataService.getId3v24Tags(audioInfo.metadata);
    const albumType = this.metadataService.getTag<string>('AlbumType', id3v2Tags, true);
    album.albumType = albumType ? albumType : this.unknownValue;

    album.favorite = false;

    this.db.hashAlbum(album);
    return album;
  }

  private processSong(album: AlbumEntity, audioInfo: IAudioInfo, fileInfo: IFileInfo): SongEntity {
    const song = new SongEntity();
    song.filePath = fileInfo.path;

    const id3v2Tags = this.metadataService.getId3v24Tags(audioInfo.metadata);
    const id = this.metadataService.getTag<IIdentifierTag>('UFID', id3v2Tags);
    if (id) {
      song.externalId = id.identifier.toString();
    }

    if (audioInfo.metadata.common.title) {
      song.name = audioInfo.metadata.common.title;
    }
    else {
      song.name = fileInfo.name;
    }

    song.primaryAlbum = album;
    song.trackNumber = audioInfo.metadata.common.track && audioInfo.metadata.common.track.no ? audioInfo.metadata.common.track.no : 0;
    song.mediaNumber = audioInfo.metadata.common.disk && audioInfo.metadata.common.disk.no ? audioInfo.metadata.common.disk.no : 0;
    song.releaseYear = album.releaseYear;
    song.releaseDecade = this.utilities.getDecade(song.releaseYear);

    if (audioInfo.metadata.common.composer && audioInfo.metadata.common.composer.length) {
      song.composer = audioInfo.metadata.common.composer[0];
    }
    if (audioInfo.metadata.common.comment && audioInfo.metadata.common.comment.length) {
      song.comment = audioInfo.metadata.common.comment[0];
    }
    if (audioInfo.metadata.common.grouping) {
      song.grouping = audioInfo.metadata.common.grouping;
    }

    song.addDate = fileInfo.addDate;
    const addDate = this.metadataService.getTag<string>('AddDate', id3v2Tags, true);
    if (addDate) {
      song.addDate = new Date(addDate);
    }

    song.changeDate = fileInfo.changeDate;
    const changeDate = this.metadataService.getTag<string>('ChangeDate', id3v2Tags, true);
    if (changeDate) {
      song.changeDate = new Date(changeDate);
    }

    song.language = this.unknownValue;
    const language = this.metadataService.getTag<string>('TLAN', id3v2Tags, true);
    if (language) {
      song.language = language;
    }

    song.mood = this.unknownValue;
    const mood = this.metadataService.getTag<string>('TMOO', id3v2Tags, true);
    if (mood) {
      song.mood = mood;
    }

    // Rating
    song.rating = 0;
    if (audioInfo.metadata.common.rating && audioInfo.metadata.common.rating.length) {
      // TODO: find rating by source

      // Default: get first item and convert
      const ratingItem = audioInfo.metadata.common.rating[0];
      if (ratingItem.rating) {
        // Since this is a 0-1 value, convert to a 0-5 value
        song.rating = Math.round(ratingItem.rating * 5);
      }
    }

    // Play Count (PCNT)
    song.playCount = 0;
    const playCount = this.metadataService.getTag<number>('PCNT', id3v2Tags, true);
    if (playCount) {
      song.playCount = playCount;
    }
    // Play Count (Popularimeter)
    if (!song.playCount) {
      const popularimeter = this.metadataService.getTag<IPopularimeterTag>('POPM', id3v2Tags, true);
      if (popularimeter && popularimeter.counter) {
        song.playCount = popularimeter.counter;
      }
    }

    // TODO: get lyrics from text file
    const lyrics = audioInfo.metadata.common.lyrics;
    if (lyrics && lyrics.length) {
      song.lyrics = lyrics[0];
    }

    if (audioInfo.metadata.common.titlesort) {
      song.titleSort = audioInfo.metadata.common.titlesort;
    }
    else {
      song.titleSort = song.name;
    }

    // Subtitle
    //const subTitle = this.metadataService.getTag<string>('TIT3', id3v2Tags, true);

    song.seconds = audioInfo.metadata.format.duration ? audioInfo.metadata.format.duration : 0;
    song.duration = this.utilities.secondsToMinutes(song.seconds);
    song.bitrate = audioInfo.metadata.format.bitrate ? audioInfo.metadata.format.bitrate : 0;
    song.frequency = audioInfo.metadata.format.sampleRate ? audioInfo.metadata.format.sampleRate : 0;
    song.vbr = audioInfo.metadata.format.codecProfile !== 'CBR';
    song.replayGain = audioInfo.metadata.format.trackGain ? audioInfo.metadata.format.trackGain : 0;
    song.fullyParsed = audioInfo.fullyParsed;
    song.favorite = false;

    this.db.hashSong(song);
    return song;
  }

  private processArtists(audioInfo: IAudioInfo): ArtistEntity[] {
    const artists: ArtistEntity[] = [];

    if (audioInfo.metadata.common.artists && audioInfo.metadata.common.artists.length) {
      // Try to find multiple artist sorts as well
      const id3v2Tags = this.metadataService.getId3v24Tags(audioInfo.metadata);
      const artistSorts = this.metadataService.getTags<string>('TSOP', id3v2Tags);
      let artistIndex = 0;
      for (const artistName of audioInfo.metadata.common.artists) {
        const artist = new ArtistEntity();
        artist.name = artistName;
        artist.favorite = false;
        artist.artistType = this.unknownValue;
        artist.country = this.unknownValue;
        // Sort
        if (artistSorts && artistSorts.length > artistIndex) {
          // assuming sorts come in the same order as artists
          artist.artistSort = artistSorts[artistIndex];
        }
        else {
          artist.artistSort = artist.name;
        }

        this.db.hashArtist(artist);
        artists.push(artist);
        artistIndex++;
      }
    }

    return artists;
  }

  private processGenres(audioInfo: IAudioInfo): ClassificationEntity[] {
    const genres: ClassificationEntity[] = [];

    if (audioInfo.metadata.common.genre && audioInfo.metadata.common.genre.length) {
      const classificationType = 'Genre';
      for (const genreName of audioInfo.metadata.common.genre) {
        // TODO: also add the full genre text (including slashes) as genre
        // Besides multiple genres in array, also support multiple genres separated by /
        const subGenres = genreName.split('/');
        for (const subGenreName of subGenres) {
          const genre = new ClassificationEntity();
          genre.name = subGenreName;
          genre.classificationType = classificationType;
          this.db.hashClassification(genre);
          const existingGenre = genres.find(g => g.id === genre.id);
          if (!existingGenre) {
            genres.push(genre);
          }
        }
      }
    }
    return genres;
  }

  private processClassifications(audioInfo: IAudioInfo): ClassificationEntity[] {
    const classifications: ClassificationEntity[] = [];

    const tags = this.metadataService.getId3v24Tags(audioInfo.metadata);
    if (tags && tags.length) {
      for (const tag of tags) {
        if (tag.id.toLowerCase().startsWith('txxx:classificationtype:')) {
          const tagIdParts = tag.id.split(':');
          if (tagIdParts.length > 2) {
            const classificationType = tagIdParts[2];
            const classificationNames = tag.value ? tag.value.toString() : null;
            if (classificationNames) {
              const names = classificationNames.split(',');
              for (const name of names) {
                const classification = new ClassificationEntity();
                classification.name = name;
                classification.classificationType = classificationType;
                this.db.hashClassification(classification);
                const existingClassification = classifications.find(c => c.id === classification.id);
                if (!existingClassification) {
                  classifications.push(classification);
                }
              }
            }
          }
        }
      }
    }
    return classifications;
  }

  public async processPlaylistFile(fileInfo: IFileInfo): Promise<any> {
    const fileContent = this.fileService.getFileContent(fileInfo.path);
    const fileLines = fileContent.replace(/(\r)/gm, '').split('\n');
    if (fileLines.length) {
      const firstLine = fileLines[0].toUpperCase();

      if (firstLine === '[PLAYLIST]') {
        const playlist = await this.createPlaylist(fileInfo.name);
        if (playlist) {
          return this.processPls(playlist, fileInfo, fileLines);
        }
        
      }

      if (firstLine === '#EXTM3U') {
        const playlist = await this.createPlaylist(fileInfo.name);
        if (playlist) {
          return this.processM3u(playlist, fileInfo, fileLines);
        }
      }
    }

    return null;
  }

  private async createPlaylist(name: string): Promise<PlaylistEntity> {
    const playlist = new PlaylistEntity();
    playlist.name = name;
    playlist.favorite = false;
    this.db.hashPlaylist(playlist);
    const playlistExists = await this.db.exists(playlist.id, PlaylistEntity);
    if (playlistExists) {
      // Playlist already exists
      return null;
    }
    await playlist.save();
    this.events.broadcast(AppEvent.ScanPlaylistCreated, playlist);
    return playlist;
  }

  private async processPls(playlist: PlaylistEntity, fileInfo: IFileInfo, lines: string[]): Promise<any> {
    let songSequence = 1;
    for (const line of lines) {
      if (line.startsWith('File')) {
        const lineParts = line.split('=');
        if (lineParts.length > 1) {
          // TODO: validate proper audio extension
          const audioFilePath = this.fileService.getAbsolutePath(fileInfo.directoryPath, lineParts[1]);
          const track = await this.addPlaylistSong(playlist, audioFilePath, songSequence);
          if (track) {
            songSequence++;
            this.events.broadcast(AppEvent.ScanTrackAdded, track);
          }
        }
      }
    }
  }

  private async processM3u(playlist: PlaylistEntity, fileInfo: IFileInfo, lines: string[]): Promise<any> {
    let songSequence = 1;
    for (const line of lines) {
      if (!line.startsWith('#EXTINF')) {
        const audioFilePath = this.fileService.getAbsolutePath(fileInfo.directoryPath, line);
        const track = await this.addPlaylistSong(playlist, audioFilePath, songSequence);
        if (track) {
          songSequence++;
          this.events.broadcast(AppEvent.ScanTrackAdded, track);
        }
      }
    }
  }

  private async addPlaylistSong(playlist: PlaylistEntity, songFilePath: string, sequence: number): Promise<PlaylistSongEntity> {
    const song = await SongEntity.findOneBy({ filePath: songFilePath });
    if (song) {
      const playlistSong = new PlaylistSongEntity();
      playlistSong.playlist = playlist;
      playlistSong.song = song;
      playlistSong.sequence = sequence;
      await playlistSong.save();
      playlistSong.song = song;
      return playlistSong;
    }

    this.log.warn('Playlist audio file not found.', songFilePath);
    return null;
  }
}
