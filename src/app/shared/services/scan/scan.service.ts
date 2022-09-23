import { Injectable } from '@angular/core';
import { createHash } from 'crypto';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AlbumEntity } from '../../models/album.entity';
import { ArtistEntity } from '../../models/artist.entity';
import { GenreEntity } from '../../models/genre.entity';
import { SongArtistEntity } from '../../models/song-artist.entity';
import { SongGenreEntity } from '../../models/song-genre.entity';
import { SongEntity } from '../../models/song.entity';
import { DatabaseService } from '../database/database.service';
import { FileService } from '../file/file.service';
import { IFileInfo, IIdentifierTag, ILyricsTag } from '../music-metadata/music-metadata.interface';
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
    private db: DatabaseService) { }

  scan(selectedFolderPath: string): Promise<void> {
    return new Promise(resolve => {
      const files: string[] = [];
      this.fileService.getFilesAsync(selectedFolderPath).subscribe({
        next: filePath => {
          if (filePath.toLowerCase().endsWith('.mp3')) {
            files.push(filePath);
            console.log(filePath);
          }
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

  private async processFile(filePath: string): Promise<void> {
    const fileMetadata = await this.metadataService.getMetadata(filePath, true);
    const fileInfo: IFileInfo = {
      filePath,
      paths: filePath.split('\\').reverse(),
      metadata: fileMetadata
    };

    const primaryArtist = this.processAlbumArtist(fileInfo);
    await primaryArtist.save();
    const primaryAlbum = this.processAlbum(primaryArtist, fileInfo);
    await primaryAlbum.save();
    const song = this.processSong(primaryAlbum, fileInfo);
    await song.save();

    const artists = this.processMultipleArtists(fileInfo);
    for (const artist of artists) {
      // Only add if it does not exist, otherwise it will update an existing record
      // and wipe out other fields
      if (!await this.db.artistExists(artist.id)) {
        await artist.save();
      }
    }

    // Make sure the primary artist is part of the song artists
    if (!artists.find(a => a.id === primaryArtist.id)) {
      artists.push(primaryArtist);
    }
    // TODO: create composite primary key
    const songArtists = this.processSongArtists(song, artists);
    for (const songArtist of songArtists) {
      await songArtist.save();
    }

    const genres = this.processMultipleGenres(fileInfo);
    for (const genre of genres) {
      await genre.save();
    }

    // TODO: add default genre if no one found
    // TODO: create composite primary key
    const songGenres = this.processSongGenres(song, genres);
    for (const songGenre of songGenres) {
      await songGenre.save();
    }
  }

  private processAlbumArtist(fileInfo: IFileInfo): ArtistEntity {
    const artist = new ArtistEntity();

    artist.name = this.unknownValue;
    if (fileInfo.metadata.common.artist) {
      artist.name = fileInfo.metadata.common.artist;
    }
    artist.id = this.hash(artist.name);
    artist.favorite = false;

    const artistType = this.metadataService.getId3v24Tag<string>('ARTISTTYPE', fileInfo.metadata, true);
    artist.artistType = artistType ? artistType : this.unknownValue;

    const country = this.metadataService.getId3v24Tag<string>('COUNTRY', fileInfo.metadata, true);
    artist.country = country ? country : this.unknownValue;

    return artist;
  }

  private processAlbum(artist: ArtistEntity, fileInfo: IFileInfo): AlbumEntity {
    const album = new AlbumEntity();

    album.primaryArtistId = artist.id;

    album.name = this.unknownValue;
    if (fileInfo.metadata.common.album) {
      album.name = fileInfo.metadata.common.album;
    }

    album.releaseYear = 0;
    if (fileInfo.metadata.common.year) {
      // Hack for SoloSoft: ignore 1900
      if (fileInfo.metadata.common.year !== 1900) {
        album.releaseYear = fileInfo.metadata.common.year;
      }
    }

    // Combine these fields to make album unique
    album.id = this.hash(`${artist.name}|${album.name}|${album.releaseYear}`);

    const albumType = this.metadataService.getId3v24Tag<string>('ALBUMTYPE', fileInfo.metadata, true);
    album.albumType = albumType ? albumType : this.unknownValue;

    album.favorite = false;

    return album;
  }

  private processSong(album: AlbumEntity, fileInfo: IFileInfo): SongEntity {
    const song = new SongEntity();
    song.filePath = fileInfo.filePath;
    song.id = this.hash(song.filePath);

    const id = this.metadataService.getId3v24Tag<IIdentifierTag>('UFID', fileInfo.metadata);
    if (id) {
      song.externalId = id.identifier.toString();
    }

    if (fileInfo.metadata.common.title) {
      song.name = fileInfo.metadata.common.title;
    }
    else {
      song.name = fileInfo.paths[0];
    }

    song.primaryAlbumId = album.id;
    song.trackNumber = fileInfo.metadata.common.track && fileInfo.metadata.common.track.no ? fileInfo.metadata.common.track.no : 0;
    song.mediaNumber = fileInfo.metadata.common.disk && fileInfo.metadata.common.disk.no ? fileInfo.metadata.common.disk.no : 0;
    song.releaseYear = album.releaseYear;
    song.releaseDecade = this.utilities.getDecade(song.releaseYear);

    if (fileInfo.metadata.common.composer && fileInfo.metadata.common.composer.length) {
      song.composer = fileInfo.metadata.common.composer[0];
    }
    if (fileInfo.metadata.common.comment && fileInfo.metadata.common.comment.length) {
      song.comment = fileInfo.metadata.common.comment[0];
    }

    song.addDate = new Date();
    const addDate = this.metadataService.getId3v24Tag<string>('TDAT', fileInfo.metadata, true);
    if (addDate) {
      song.addDate = new Date(addDate);
    }

    song.changeDate = song.addDate;
    const changeDate = this.metadataService.getId3v24Tag<string>('CHANGEDATE', fileInfo.metadata, true);
    if (changeDate) {
      song.changeDate = new Date(changeDate);
    }

    song.language = this.unknownValue;
    const language = this.metadataService.getId3v24Tag<string>('TLAN', fileInfo.metadata, true);
    if (language) {
      song.language = language;
    }

    song.mood = this.unknownValue;
    const mood = this.metadataService.getId3v24Tag<string>('TMOO', fileInfo.metadata, true);
    if (mood) {
      song.mood = mood;
    }

    song.playCount = 0;
    const playCount = this.metadataService.getId3v24Tag<string>('PLAYCOUNT', fileInfo.metadata, true);
    if (playCount) {
      song.playCount = parseInt(playCount, 10);
    }

    song.rating = 0;
    const rating = this.metadataService.getId3v24Tag<string>('RATING', fileInfo.metadata, true);
    if (rating) {
      song.rating = parseInt(rating, 10);
    }

    // TODO: get lyrics from text file
    const lyrics = this.metadataService.getId3v24Tag<ILyricsTag>('USLT', fileInfo.metadata);
    if (lyrics) {
      song.lyrics = lyrics.text;
    }

    song.seconds = fileInfo.metadata.format.duration ? fileInfo.metadata.format.duration : 0;
    song.duration = this.utilities.secondsToMinutes(song.seconds);
    song.bitrate = fileInfo.metadata.format.bitrate ? fileInfo.metadata.format.bitrate : 0;
    song.vbr = fileInfo.metadata.format.codecProfile !== 'CBR';
    song.replayGain = fileInfo.metadata.format.trackGain ? fileInfo.metadata.format.trackGain : 0;

    return song;
  }

  private processMultipleArtists(fileInfo: IFileInfo): ArtistEntity[] {
    const artists: ArtistEntity[] = [];

    if (fileInfo.metadata.common.artists && fileInfo.metadata.common.artists.length) {
      for (const artistName of fileInfo.metadata.common.artists) {
        const artist = new ArtistEntity();
        artist.name = artistName;
        artist.id = this.hash(artistName);
        artist.favorite = false;
        artist.artistType = this.unknownValue;
        artist.country = this.unknownValue;
        artists.push(artist);
      }
    }

    return artists;
  }

  private processSongArtists(song: SongEntity, artists: ArtistEntity[]): SongArtistEntity[] {
    const songArtists: SongArtistEntity[] = [];

    for (const artist of artists) {
      const songArtist = new SongArtistEntity();
      songArtist.songId = song.id;
      songArtist.artistId = artist.id;
      songArtists.push(songArtist);
    }
    return songArtists;
  }

  private processMultipleGenres(fileInfo: IFileInfo): GenreEntity[] {
    const genres: GenreEntity[] = [];

    if (fileInfo.metadata.common.genre && fileInfo.metadata.common.genre.length) {
      for (const genreName of fileInfo.metadata.common.genre) {
        // Besides multiple genres in array, also support multiple genres separated by /
        const subGenres = genreName.split('/');
        for (const subGenreName of subGenres) {
          const genre = new GenreEntity();
          genre.id = this.hash(subGenreName);
          genre.name = subGenreName;
          genres.push(genre);
        }
      }
    }
    return genres;
  }

  private processSongGenres(song: SongEntity, genres: GenreEntity[]): SongGenreEntity[] {
    const songGenres: SongGenreEntity[] = [];

    for (const genre of genres) {
      const songGenre = new SongGenreEntity();
      songGenre.songId = song.id;
      songGenre.genreId = genre.id;
      songGenres.push(songGenre);
    }
    return songGenres;
  }

  private hash(value: string): string {
    return createHash('sha1').update(value).digest('base64');
  }
}
