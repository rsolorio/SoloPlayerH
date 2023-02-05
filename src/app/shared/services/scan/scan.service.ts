import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { Not } from 'typeorm';
import {
  ArtistEntity,
  AlbumEntity,
  ClassificationEntity,
  SongEntity,
  PlaylistEntity,
  PlaylistSongEntity,
  ModuleOptionEntity,
  SongArtistEntity,
  SongClassificationEntity
} from '../../entities';
import { AppEvent } from '../../models/events.enum';
import { ModuleOptionName } from '../../models/module-option.enum';
import { DatabaseService } from '../database/database.service';
import { IFileInfo } from '../file/file.interface';
import { FileService } from '../file/file.service';
import { IAudioInfo, IIdentifierTag, IMemoTag, IPopularimeterTag } from '../music-metadata/music-metadata.interface';
import { MusicMetadataService } from '../music-metadata/music-metadata.service';

@Injectable({
  providedIn: 'root'
})
export class ScanService {

  private unknownValue = 'Unknown';
  private existingArtists: ArtistEntity[];
  private existingAlbums: AlbumEntity[];
  private existingGenres: ClassificationEntity[];
  private existingClassifications: ClassificationEntity[];
  private existingSongs: SongEntity[];
  private existingSongArtists: SongArtistEntity[];
  private existingSongClassifications: SongClassificationEntity[];

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
      this.fileService.getFiles(folderPath).subscribe({
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

  private async beforeProcess(): Promise<void> {
    // Prepare global variables
    this.existingArtists = await ArtistEntity.find();
    this.existingAlbums = await AlbumEntity.find();
    this.existingGenres = await ClassificationEntity.findBy({ classificationType: 'Genre' });
    this.existingClassifications = await ClassificationEntity.findBy({ classificationType: Not('Genre') });
    this.existingSongs = await SongEntity.find();
    this.existingSongArtists = [];
    this.existingSongClassifications = [];
  }

  private async afterProcess(): Promise<void> {
    // Artists
    const newArtists = this.existingArtists.filter(artist => artist.isNew);
    if (newArtists.length) {
      await this.db.bulkInsert(ArtistEntity, newArtists);
    }
    const artistsToBeUpdated = this.existingArtists.filter(artist => artist.hasChanges);
    if (artistsToBeUpdated.length) {
      await this.db.bulkUpdate(ArtistEntity, artistsToBeUpdated, ['artistType', 'artistSort', 'artistStylized', 'country']);
    }
    this.existingArtists = [];
    // Albums
    const newAlbums = this.existingAlbums.filter(album => album.isNew);
    if (newAlbums.length) {
      await this.db.bulkInsert(AlbumEntity, newAlbums);
    }    
    this.existingAlbums = [];
    // Genres
    const newGenres = this.existingGenres.filter(genre => genre.isNew);
    if (newGenres.length) {
      await this.db.bulkInsert(ClassificationEntity, newGenres);
    }
    this.existingGenres = [];
    // Classifications
    const newClassifications = this.existingClassifications.filter(classification => classification.isNew);
    if (newClassifications.length) {
      await this.db.bulkInsert(ClassificationEntity, newClassifications);
    }
    this.existingClassifications = [];
    // Songs
    const newSongs = this.existingSongs.filter(song => song.isNew);
    if (newSongs.length) {
      await this.db.bulkInsert(SongEntity, newSongs);
    }
    this.existingSongs = [];
    // SongArtists
    await this.db.bulkInsert(SongArtistEntity, this.existingSongArtists);
    this.existingSongArtists = [];
    // SongClassifications
    await this.db.bulkInsert(SongClassificationEntity, this.existingSongClassifications);
    this.existingSongClassifications = [];
  }

  public async processAudioFiles(files: IFileInfo[], options: ModuleOptionEntity[], beforeCallback?: (count: number, fileInfo: IFileInfo) => void): Promise<IAudioInfo[]> {
    await this.beforeProcess();
    let fileCount = 0;
    const result: IAudioInfo[] = [];
    for (const file of files) {
      fileCount++;
      if (beforeCallback) {
        beforeCallback(fileCount, file);
      }
      const audioInfo = await this.processAudioFile(file, options);
      result.push(audioInfo);
    }
    await this.afterProcess();
    return result;
  }

  private async processAudioFile(fileInfo: IFileInfo, options: ModuleOptionEntity[]): Promise<IAudioInfo> {
    const buffer = await this.fileService.getBuffer(fileInfo.path);
    const audioInfo = await this.metadataService.getMetadata(buffer, true);
    audioInfo.fileInfo = fileInfo;
    if (!audioInfo || audioInfo.error) {
      return audioInfo;
    }

    // PRIMARY ALBUM ARTIST
    const primaryArtist = this.processAlbumArtist(audioInfo);

    // MULTIPLE ARTISTS
    const artists = this.processArtists(audioInfo, []);

    // PRIMARY ALBUM
    // Hack for SoloSoft: ignore 1900
    const primaryAlbum = this.processAlbum(primaryArtist, audioInfo, [1900]);

    // GENRES
    // TODO: add default genre if no one found
    let genreSplitSymbols: string[] = [];
    const genreSplitOption = options.find(option => option.name === ModuleOptionName.GenreSplitCharacters);
    if (genreSplitOption) {
      genreSplitSymbols = this.db.getOptionTextValues(genreSplitOption);
    }
    const genres = this.processGenres(audioInfo, genreSplitSymbols);

    // CLASSIFICATIONS
    const classifications = this.processClassifications(audioInfo);

    // SONG - ARTISTS/GENRES/CLASSIFICATIONS
    const song = this.processSong(primaryAlbum, audioInfo, fileInfo);
    // Make sure the primary artist is part of the song artists
    if (!artists.find(a => a.id === primaryArtist.id)) {
      artists.push(primaryArtist);
    }
    // TODO: if the song already exists, update data
    if (!this.existingSongs.find(s => s.id === song.id)) {
      this.existingSongs.push(song);

      // If we are adding a new song, all its artists are new as well, so push them to cache
      for (const artist of artists) {
        const songArtist = new SongArtistEntity();
        songArtist.songId = song.id;
        songArtist.artistId = artist.id;
        songArtist.artistRoleTypeId = 1; // Performer
        this.existingSongArtists.push(songArtist);
      }
      // Same for classifications
      for (const classification of [...genres, ...classifications]) {
        const songClassification = new SongClassificationEntity();
        songClassification.songId = song.id;
        songClassification.classificationId = classification.id;
        this.existingSongClassifications.push(songClassification);
      }
    }

    return audioInfo;
  }

  private processAlbumArtist(audioInfo: IAudioInfo): ArtistEntity {
    const id3v2Tags = this.metadataService.getId3v24Tags(audioInfo.metadata);
    const artistType = this.metadataService.getTag<string>('ArtistType', id3v2Tags, true);
    const country = this.metadataService.getTag<string>('Country', id3v2Tags, true);
    const artistStylized = this.metadataService.getTag<string>('ArtistStylized', id3v2Tags, true);
    const artistSort = audioInfo.metadata.common.albumartistsort;
    let artistName = this.unknownValue;
    if (audioInfo.metadata.common.albumartist) {
      artistName = audioInfo.metadata.common.albumartist;
    }
    else if (audioInfo.metadata.common.artists && audioInfo.metadata.common.artists.length) {
      artistName = audioInfo.metadata.common.artists[0];
    }

    const newArtist = new ArtistEntity();
    newArtist.isNew = true;
    newArtist.name = artistName;
    newArtist.artistSort = artistSort ? artistSort : newArtist.name;
    newArtist.favorite = false;
    newArtist.artistType = artistType ? artistType : this.unknownValue;
    newArtist.country = country ? country : this.unknownValue;
    newArtist.artistStylized = artistStylized ? artistStylized : artistName;
    this.db.hashArtist(newArtist);

    const existingArtist = this.existingArtists.find(a => a.id === newArtist.id);
    if (existingArtist) {
      if (existingArtist.artistType === this.unknownValue && existingArtist.artistType !== newArtist.artistType) {
        existingArtist.artistType = newArtist.artistType;
        if (!existingArtist.isNew) {
          existingArtist.hasChanges = true;
        }
      }
      if (existingArtist.country === this.unknownValue && existingArtist.country !== newArtist.country) {
        existingArtist.country = newArtist.country;
        if (!existingArtist.isNew) {
          existingArtist.hasChanges = true;
        }
      }
      if (existingArtist.artistStylized === existingArtist.name && existingArtist.artistStylized !== newArtist.artistStylized) {
        existingArtist.artistStylized = newArtist.artistStylized;
        if (!existingArtist.isNew) {
          existingArtist.hasChanges = true;
        }
      }
      if (existingArtist.artistSort === existingArtist.artistSort && existingArtist.artistSort !== newArtist.artistSort) {
        existingArtist.artistSort = newArtist.artistSort;
        if (!existingArtist.isNew) {
          existingArtist.hasChanges = true;
        }
      }
      return existingArtist;
    }

    this.existingArtists.push(newArtist);
    return newArtist;
  }

  private processAlbum(artist: ArtistEntity, audioInfo: IAudioInfo, ignoredYears?: number[]): AlbumEntity {
    const newAlbum = new AlbumEntity();
    newAlbum.isNew = true;
    newAlbum.primaryArtist = artist;
    newAlbum.name = this.unknownValue;
    if (audioInfo.metadata.common.album) {
      newAlbum.name = audioInfo.metadata.common.album;
    }
    newAlbum.releaseYear = 0;
    if (audioInfo.metadata.common.year) {
      if (!ignoredYears || !ignoredYears.length || !ignoredYears.includes(audioInfo.metadata.common.year)) {
        // Is this actually the album year? Album year and song year might be different.
        newAlbum.releaseYear = audioInfo.metadata.common.year;
      }
    }
    newAlbum.releaseDecade = this.utilities.getDecade(newAlbum.releaseYear);
    // We have enough information to hash
    this.db.hashAlbum(newAlbum);

    const existingAlbum = this.existingAlbums.find(a => a.id === newAlbum.id);
    if (existingAlbum) {
      // TODO: update other fields if info is missing

      // Use the latest song year to set the album year
      if (newAlbum.releaseYear > existingAlbum.releaseYear) {
        existingAlbum.releaseYear = newAlbum.releaseYear;
        existingAlbum.hasChanges = true;
      }
      return existingAlbum;
    }

    if (audioInfo.metadata.common.albumsort) {
      newAlbum.albumSort = audioInfo.metadata.common.albumsort;
    }
    else {
      newAlbum.albumSort = newAlbum.name;
    }

    const id3v2Tags = this.metadataService.getId3v24Tags(audioInfo.metadata);
    const albumType = this.metadataService.getTag<string>('AlbumType', id3v2Tags, true);
    newAlbum.albumType = albumType ? albumType : this.unknownValue;

    newAlbum.favorite = false;
    this.existingAlbums.push(newAlbum);
    return newAlbum;
  }

  private processSong(album: AlbumEntity, audioInfo: IAudioInfo, fileInfo: IFileInfo): SongEntity {
    const song = new SongEntity();
    song.isNew = true;
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

    // Popularimeter that can have rating and/or play count
    const popularimeter = this.metadataService.getTag<IPopularimeterTag>('POPM', id3v2Tags);

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
    else if (popularimeter && popularimeter.rating) {
      // This is a 0-255 value, convert to 0-1 value
      const value = popularimeter.rating / 255;
      // Convert to a 0-5 value
      song.rating = Math.round(value * 5);
    }

    // Play Count (PCNT)
    song.playCount = 0;
    const playCount = this.metadataService.getTag<number>('PCNT', id3v2Tags);
    if (playCount) {
      song.playCount = playCount;
    }
    else if (popularimeter && popularimeter.counter) {
      song.playCount = popularimeter.counter;
    }
    
    const lyrics = audioInfo.metadata.common.lyrics;
    if (lyrics && lyrics.length) {
      song.lyrics = lyrics[0];
    }

    if (audioInfo.metadata.common.lyrics && audioInfo.metadata.common.lyrics.length) {
      song.lyrics = audioInfo.metadata.common.lyrics[0];
    }
    else {
      const unsyncLyrics = this.metadataService.getTag<IMemoTag>('USLT', id3v2Tags);
      if (unsyncLyrics) {
        song.lyrics = unsyncLyrics.text;
      }
      else {
        // TODO: get lyrics from text file
      }
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

  private processArtists(audioInfo: IAudioInfo, splitSymbols: string[]): ArtistEntity[] {
    // This is the list of artists that will be eventually associated with a song
    const artists: ArtistEntity[] = [];

    if (audioInfo.metadata.common.artists && audioInfo.metadata.common.artists.length) {
      // Try to find multiple artist sorts as well
      const id3v2Tags = this.metadataService.getId3v24Tags(audioInfo.metadata);
      // Retrieving this way since the metadata only contains one artist sort
      const artistSorts = this.metadataService.getTags<string>('TSOP', id3v2Tags);
      // Index to match the artist with the artist sort
      let artistIndex = 0;
      for (const artistName of audioInfo.metadata.common.artists) {
        // Assuming sorts come in the same order as artists
        const artistSort = artistSorts && artistSorts.length > artistIndex ? artistSorts[artistIndex] : artistName;
        // Move to the next index since we are done using this one
        artistIndex++;
        const newArtist = this.createArtist(artistName, artistSort);
        const existingArtist = this.existingArtists.find(a => a.id === newArtist.id);
        if (existingArtist) {
          if (existingArtist.artistSort === existingArtist.name && existingArtist.artistSort !== newArtist.artistSort) {
            existingArtist.artistSort = newArtist.artistSort;
            if (!existingArtist.isNew) {
              existingArtist.hasChanges = true;
            }
          }
          if (!artists.find(a => a.id === existingArtist.id)) {
            artists.push(existingArtist);
          }
        }
        else {
          // First, add the artist as it is
          this.existingArtists.push(newArtist);
          artists.push(newArtist);

          // Second, perform split if specified
          if (splitSymbols && splitSymbols.length) {
            for (const splitSymbol of splitSymbols) {
              const splitArtistNames = artistName.split(splitSymbol);
              for (const splitArtistName of splitArtistNames) {
                const newSplitArtist = this.createArtist(splitArtistName, splitArtistName);
                const existingSplitArtist = this.existingArtists.find(a => a.id === newSplitArtist.id);
                if (existingSplitArtist) {
                  if (!artists.find(a => a.id === existingSplitArtist.id)) {
                    artists.push(existingSplitArtist);
                  }
                }
                else {
                  this.existingArtists.push(newSplitArtist);
                  artists.push(newSplitArtist);
                }
              }
            }
          }
        }
      }
    }

    return artists;
  }

  private createArtist(artistName: string, artistSort: string): ArtistEntity {
    const artist = new ArtistEntity();
    artist.isNew = true;
    artist.name = artistName;
    artist.artistStylized = artistName;
    artist.artistSort = artistSort;
    artist.favorite = false;
    artist.artistType = this.unknownValue;
    artist.country = this.unknownValue;
    this.db.hashArtist(artist);
    return artist;
  }

  private processGenres(audioInfo: IAudioInfo, splitSymbols: string[]): ClassificationEntity[] {
    const genres: ClassificationEntity[] = [];
    if (audioInfo.metadata.common.genre && audioInfo.metadata.common.genre.length) {
      for (const genreName of audioInfo.metadata.common.genre) {
        this.processGenre(genreName, genres);
        if (splitSymbols && splitSymbols.length) {
          for (const splitSymbol of splitSymbols) {
            const splitGenreNames = genreName.split(splitSymbol);
            for (const splitGenreName of splitGenreNames) {
              this.processGenre(splitGenreName, genres);
            }
          }
        }
      }
    }
    return genres;
  }

  private processGenre(name: string, genres: ClassificationEntity[]): void {
    const newGenre = this.createGenre(name);
    const existingGenre = this.existingGenres.find(g => g.id === newGenre.id);
    if (existingGenre) {
      if (!genres.find(g => g.id === existingGenre.id)) {
        genres.push(existingGenre);
      }
    }
    else {
      this.existingGenres.push(newGenre);
      genres.push(newGenre);
    }
  }

  private createGenre(name: string): ClassificationEntity {
    const genre = new ClassificationEntity();
    genre.isNew = true;
    genre.name = name;
    genre.classificationType = 'Genre';
    this.db.hashClassification(genre);
    return genre;
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
                const newClassification = new ClassificationEntity();
                newClassification.isNew = true;
                newClassification.name = name;
                newClassification.classificationType = classificationType;
                this.db.hashClassification(newClassification);
                const existingClassification = this.existingClassifications.find(c => c.id === newClassification.id);
                if (existingClassification) {
                  if (!classifications.find(c => c.id === existingClassification.id)) {
                    classifications.push(existingClassification);
                  }
                }
                else {
                  this.existingClassifications.push(newClassification);
                  classifications.push(newClassification);
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
    const fileContent = await this.fileService.getText(fileInfo.path);
    // Remove \r and then split by \n
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

  private artistNeedsUpdate(existingArtist: ArtistEntity, newArtist: ArtistEntity): boolean {
    if (!existingArtist.artistType && newArtist.artistType) {
      return true;
    }
    if (!existingArtist.country && newArtist.country) {
      return true;
    }
    if (existingArtist.artistStylized !== newArtist.artistStylized) {
      return true;
    }
    return false;
  }
}
