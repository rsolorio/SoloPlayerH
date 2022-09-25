import { Injectable } from '@angular/core';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AlbumEntity } from '../../models/album.entity';
import { ArtistEntity } from '../../models/artist.entity';
import { ClassificationEntity } from '../../models/classification.entity';
import { SongArtistEntity } from '../../models/song-artist.entity';
import { SongClassificationEntity } from '../../models/song-classification.entity';
import { SongEntity } from '../../models/song.entity';
import { DatabaseService } from '../database/database.service';
import { IFileInfo } from '../file/file.interface';
import { FileService } from '../file/file.service';
import { IAudioInfo, IIdentifierTag, IMemoTag } from '../music-metadata/music-metadata.interface';
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
      const files: IFileInfo[] = [];
      this.fileService.getFilesAsync(selectedFolderPath).subscribe({
        next: fileInfo => {
          if (fileInfo.name.toLowerCase().endsWith('.mp3')) {
            files.push(fileInfo);
            console.log(fileInfo.path);
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

  private async processFile(fileInfo: IFileInfo): Promise<void> {
    const info = await this.metadataService.getMetadata(fileInfo, true);

    const primaryArtist = this.processAlbumArtist(info);
    await this.db.add(primaryArtist, ArtistEntity);
    const primaryAlbum = this.processAlbum(primaryArtist, info);
    await this.db.add(primaryAlbum, AlbumEntity);
    const song = this.processSong(primaryAlbum, info);
    // TODO: if the song already exists, update data
    await this.db.add(song, SongEntity);

    const artists = this.processArtists(info);
    for (const artist of artists) {
      // Only add if it does not exist, otherwise it will update an existing record
      // and wipe out other fields
      await this.db.add(artist, ArtistEntity);
    }

    // Make sure the primary artist is part of the song artists
    if (!artists.find(a => a.id === primaryArtist.id)) {
      artists.push(primaryArtist);
    }
    const songArtists = this.processSongArtists(song, artists);
    for (const songArtist of songArtists) {
      await this.db.addSongArtist(songArtist);
    }

    const genres = this.processGenres(info);
    for (const genre of genres) {
      await this.db.add(genre, ClassificationEntity);
    }

    // TODO: add default genre if no one found
    const songGenres = this.processSongGenres(song, genres);
    for (const songGenre of songGenres) {
      await this.db.AddSongClassification(songGenre);
    }

    const classifications = this.processClassifications(info);
    for (const classification of classifications) {
      await this.db.add(classification, ClassificationEntity);
    }

    const songClassifications = this.processSongClassifications(song, classifications);
    for (const songClassification of songClassifications) {
      await this.db.AddSongClassification(songClassification);
    }
  }

  private processAlbumArtist(audioInfo: IAudioInfo): ArtistEntity {
    const artist = new ArtistEntity();

    artist.name = this.unknownValue;
    if (audioInfo.metadata.common.artist) {
      artist.name = audioInfo.metadata.common.artist;
    }
    artist.id = this.db.hash(artist.name);
    artist.favorite = false;

    const artistType = this.metadataService.getId3v24Tag<string>('ARTISTTYPE', audioInfo.metadata, true);
    artist.artistType = artistType ? artistType : this.unknownValue;

    const country = this.metadataService.getId3v24Tag<string>('COUNTRY', audioInfo.metadata, true);
    artist.country = country ? country : this.unknownValue;

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

    // Combine these fields to make album unique
    album.id = this.db.hash(`${artist.name}|${album.name}|${album.releaseYear}`);

    const albumType = this.metadataService.getId3v24Tag<string>('ALBUMTYPE', audioInfo.metadata, true);
    album.albumType = albumType ? albumType : this.unknownValue;

    album.favorite = false;

    return album;
  }

  private processSong(album: AlbumEntity, audioInfo: IAudioInfo): SongEntity {
    const song = new SongEntity();
    song.filePath = audioInfo.fileInfo.path;
    song.id = this.db.hash(song.filePath);

    const id = this.metadataService.getId3v24Tag<IIdentifierTag>('UFID', audioInfo.metadata);
    if (id) {
      song.externalId = id.identifier.toString();
    }

    if (audioInfo.metadata.common.title) {
      song.name = audioInfo.metadata.common.title;
    }
    else {
      song.name = audioInfo.fileInfo.name;
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

    song.addDate = audioInfo.fileInfo.addDate;
    const addDate = this.metadataService.getId3v24Tag<string>('TDAT', audioInfo.metadata, true);
    if (addDate) {
      song.addDate = new Date(addDate);
    }

    song.changeDate = audioInfo.fileInfo.changeDate;
    const changeDate = this.metadataService.getId3v24Tag<string>('CHANGEDATE', audioInfo.metadata, true);
    if (changeDate) {
      song.changeDate = new Date(changeDate);
    }

    song.language = this.unknownValue;
    const language = this.metadataService.getId3v24Tag<string>('TLAN', audioInfo.metadata, true);
    if (language) {
      song.language = language;
    }

    song.mood = this.unknownValue;
    const mood = this.metadataService.getId3v24Tag<string>('TMOO', audioInfo.metadata, true);
    if (mood) {
      song.mood = mood;
    }

    song.playCount = 0;
    const playCount = this.metadataService.getId3v24Tag<string>('PLAYCOUNT', audioInfo.metadata, true);
    if (playCount) {
      song.playCount = parseInt(playCount, 10);
    }

    song.rating = 0;
    const rating = this.metadataService.getId3v24Tag<string>('RATING', audioInfo.metadata, true);
    if (rating) {
      song.rating = parseInt(rating, 10);
    }

    // TODO: get lyrics from text file
    const lyrics = this.metadataService.getId3v24Tag<IMemoTag>('USLT', audioInfo.metadata);
    if (lyrics) {
      song.lyrics = lyrics.text;
    }

    song.seconds = audioInfo.metadata.format.duration ? audioInfo.metadata.format.duration : 0;
    song.duration = this.utilities.secondsToMinutes(song.seconds);
    song.bitrate = audioInfo.metadata.format.bitrate ? audioInfo.metadata.format.bitrate : 0;
    song.frequency = audioInfo.metadata.format.sampleRate ? audioInfo.metadata.format.sampleRate : 0;
    song.vbr = audioInfo.metadata.format.codecProfile !== 'CBR';
    song.replayGain = audioInfo.metadata.format.trackGain ? audioInfo.metadata.format.trackGain : 0;
    song.fullyParsed = audioInfo.fullyParsed;

    return song;
  }

  private processArtists(audioInfo: IAudioInfo): ArtistEntity[] {
    const artists: ArtistEntity[] = [];

    if (audioInfo.metadata.common.artists && audioInfo.metadata.common.artists.length) {
      for (const artistName of audioInfo.metadata.common.artists) {
        const artist = new ArtistEntity();
        artist.name = artistName;
        artist.id = this.db.hash(artistName);
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

  private processGenres(audioInfo: IAudioInfo): ClassificationEntity[] {
    const genres: ClassificationEntity[] = [];

    if (audioInfo.metadata.common.genre && audioInfo.metadata.common.genre.length) {
      for (const genreName of audioInfo.metadata.common.genre) {
        // Besides multiple genres in array, also support multiple genres separated by /
        const subGenres = genreName.split('/');
        for (const subGenreName of subGenres) {
          const genre = new ClassificationEntity();
          genre.classificationType = 'Genre';
          genre.name = subGenreName;
          genre.id = this.db.hash(`${genre.classificationType}:${genre.name}`);
          genres.push(genre);
        }
      }
    }
    return genres;
  }

  private processSongGenres(song: SongEntity, genres: ClassificationEntity[]): SongClassificationEntity[] {
    const songGenres: SongClassificationEntity[] = [];

    for (const genre of genres) {
      const songGenre = new SongClassificationEntity();
      songGenre.songId = song.id;
      songGenre.classificationId = genre.id;
      songGenres.push(songGenre);
    }
    return songGenres;
  }

  private processClassifications(audioInfo: IAudioInfo): ClassificationEntity[] {
    const classifications: ClassificationEntity[] = [];

    const tags = this.metadataService.getId3v24Tags(audioInfo.metadata);
    if (tags && tags.length) {
      for (const tag of tags) {
        if (tag.id.toLowerCase().startsWith('txxx:classificationtype:')) {
          const tagIdParts = tag.id.split(':');
          if (tagIdParts.length > 2) {
            const classificationType = tagIdParts[1];
            const classificationName = tagIdParts[2];
            const classification = new ClassificationEntity();
            classification.name = classificationName;
            classification.classificationType = classificationType;
            classification.id = this.db.hash(`${classification.classificationType}:${classification.name}`);
            classifications.push(classification);
          }
        }
      }
    }
    return classifications;
  }

  private processSongClassifications(song: SongEntity, classifications: ClassificationEntity[]): SongClassificationEntity[] {
    const songClassifications: SongClassificationEntity[] = [];

    for (const classification of classifications) {
      const songClassification = new SongClassificationEntity();
      songClassification.songId = song.id;
      songClassification.classificationId = classification.id;
      songClassifications.push(songClassification);
    }
    return songClassifications;
  }
}
