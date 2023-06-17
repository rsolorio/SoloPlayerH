import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { Not } from 'typeorm';
import {
  ArtistEntity,
  AlbumEntity,
  SongEntity,
  PlaylistEntity,
  PlaylistSongEntity,
  ModuleOptionEntity,
  SongArtistEntity,
  SongClassificationEntity,
  ValueListEntryEntity,
  RelatedImageEntity
} from '../../entities';
import { AppEvent } from '../../models/events.enum';
import { ModuleOptionName } from '../../models/module-option.enum';
import { ValueLists } from '../database/database.lists';
import { DatabaseService } from '../database/database.service';
import { IFileInfo } from '../../../platform/file/file.interface';
import { FileService } from '../../../platform/file/file.service';
import { MusicImageType } from '../../../platform/audio-metadata/audio-metadata.enum';
import { AudioMetadataService } from '../../../platform/audio-metadata/audio-metadata.service';
import { MetadataReaderService } from 'src/app/mapping/data-transform/metadata-reader.service';
import { IImageSource, KeyValues } from 'src/app/core/models/core.interface';
import { OutputField } from 'src/app/mapping/data-transform/data-transform.enum';

@Injectable({
  providedIn: 'root'
})
export class ScanService {

  private unknownValue = 'Unknown';
  private existingArtists: ArtistEntity[];
  private existingAlbums: AlbumEntity[];
  private existingClassTypes: ValueListEntryEntity[];
  private existingGenres: ValueListEntryEntity[];
  private existingClassifications: ValueListEntryEntity[];
  private existingCountries: ValueListEntryEntity[];
  private existingArtistTypes: ValueListEntryEntity[];
  private existingAlbumTypes: ValueListEntryEntity[];
  private existingSongs: SongEntity[];
  private existingSongArtists: SongArtistEntity[];
  private existingSongClassifications: SongClassificationEntity[];
  private existingImages: RelatedImageEntity[];

  constructor(
    private fileService: FileService,
    private metadataService: AudioMetadataService,
    private metadataReader: MetadataReaderService,
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
    this.existingClassTypes = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.ClassificationType.id });
    this.existingGenres = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.Genre.id });
    this.existingClassifications = await ValueListEntryEntity.findBy({ isClassification: true, valueListTypeId: Not(ValueLists.Genre.id) });
    this.existingCountries = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.Country.id });
    this.existingArtistTypes = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.ArtistType.id });
    this.existingAlbumTypes = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.AlbumType.id });
    this.existingSongs = await SongEntity.find();
    this.existingImages = await RelatedImageEntity.find();
    this.existingSongArtists = [];
    this.existingSongClassifications = [];

    // Prepare reader
    await this.metadataReader.init();
  }

  private async syncChangesToDatabase(): Promise<void> {
    // Value lists
    const newCountries = this.existingCountries.filter(country => country.isNew);
    if (newCountries.length) {
      await this.db.bulkInsert(ValueListEntryEntity, newCountries);
      newCountries.forEach(c => c.isNew = false);
    }
    // Artists
    const newArtists = this.existingArtists.filter(artist => artist.isNew);
    if (newArtists.length) {
      await this.db.bulkInsert(ArtistEntity, newArtists);
      newArtists.forEach(a => a.isNew = false);
    }
    const artistsToBeUpdated = this.existingArtists.filter(artist => artist.hasChanges);
    if (artistsToBeUpdated.length) {
      await this.db.bulkUpdate(ArtistEntity, artistsToBeUpdated, ['artistType', 'artistSort', 'artistStylized', 'country']);
      artistsToBeUpdated.forEach(a => a.hasChanges = false);
    }
    // Albums
    const newAlbums = this.existingAlbums.filter(album => album.isNew);
    if (newAlbums.length) {
      await this.db.bulkInsert(AlbumEntity, newAlbums);
      newAlbums.forEach(a => a.isNew = false);
    }
    // Genres
    const newGenres = this.existingGenres.filter(genre => genre.isNew);
    if (newGenres.length) {
      await this.db.bulkInsert(ValueListEntryEntity, newGenres);
      newGenres.forEach(g => g.isNew = false);
    }
    // Classifications
    const newClassifications = this.existingClassifications.filter(classification => classification.isNew);
    if (newClassifications.length) {
      await this.db.bulkInsert(ValueListEntryEntity, newClassifications);
      newClassifications.forEach(c => c.isNew = false);
    }
    // Songs
    const newSongs = this.existingSongs.filter(song => song.isNew);
    if (newSongs.length) {
      await this.db.bulkInsert(SongEntity, newSongs);
      newSongs.forEach(s => s.isNew = false);
    }
    // SongArtists
    await this.db.bulkInsert(SongArtistEntity, this.existingSongArtists);
    // This array is only populated for new songs
    this.existingSongArtists = [];
    // SongClassifications
    await this.db.bulkInsert(SongClassificationEntity, this.existingSongClassifications);
    // This array is only populated for new songs
    this.existingSongClassifications = [];
    // Images
    const newImages = this.existingImages.filter(image => image.isNew);
    if (newImages.length) {
      await this.db.bulkInsert(RelatedImageEntity, newImages);
      newImages.forEach(i => i.isNew = false);
    }
  }

  public async processAudioFiles(
    files: IFileInfo[],
    options: ModuleOptionEntity[],
    beforeFileProcess?: (count: number, fileInfo: IFileInfo) => Promise<void>,
    beforeSyncChanges?: () => Promise<void>,
  ): Promise<KeyValues[]> {
    await this.beforeProcess();
    let fileCount = 0;
    const result: KeyValues[] = [];
    for (const file of files) {
      fileCount++;
      if (beforeFileProcess) {
        await beforeFileProcess(fileCount, file);
      }
      const metadata = await this.processAudioFile(file, options);
      result.push(metadata);
    }

    if (beforeSyncChanges) {
      await beforeSyncChanges();
    }
    await this.syncChangesToDatabase();
    return result;
  }

  private async processAudioFile(fileInfo: IFileInfo, options: ModuleOptionEntity[]): Promise<KeyValues> {
    const metadata = await this.metadataReader.process(fileInfo);
    const errors = metadata[OutputField.Error];
    if (errors?.length) {
      return metadata;
    }

    // // PRIMARY ALBUM ARTIST
    const primaryArtist = this.processAlbumArtist(metadata);

    // MULTIPLE ARTISTS
    const artists = this.processArtists(metadata, []);

    // PRIMARY ALBUM
    // Hack for SoloSoft: ignore 1900
    const primaryAlbum = this.processAlbum(primaryArtist, metadata, [1900]);

    // GENRES
    // TODO: add default genre if no one found
    let genreSplitSymbols: string[] = [];
    const genreSplitOption = options.find(option => option.name === ModuleOptionName.GenreSplitCharacters);
    if (genreSplitOption) {
      genreSplitSymbols = this.db.getOptionArrayValue(genreSplitOption);
    }
    const genres = this.processGenres(metadata, genreSplitSymbols);

    // CLASSIFICATIONS
    const classifications = this.processClassifications(metadata);

    // SONG - ARTISTS/GENRES/CLASSIFICATIONS
    const song = this.processSong(primaryAlbum, metadata);
    if (genres.length) {
      // Set the first genre found as the main genre
      song.genre = genres[0].name;
    }
    // Make sure the primary artist is part of the song artists
    if (!artists.find(a => a.id === primaryArtist.id)) {
      artists.push(primaryArtist);
    }

    if (this.existingSongs.find(s => s.id === song.id)) {
      // TODO: if the song already exists, update data
    }
    else {
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
      // In this case valueListTypeId represents the classificationTypeId
      const classificationGroups = this.utilities.groupByKey(classifications, 'valueListTypeId');
      // Add genres to this grouping
      classificationGroups[ValueLists.Genre.id] = genres;
      // For each type setup a primary value which will be the first one
      for (const classificationType of Object.keys(classificationGroups)) {
        const classificationList = classificationGroups[classificationType];
        let primary = true;
        for (const classification of classificationList) {
          const songClassification = new SongClassificationEntity();
          songClassification.songId = song.id;
          songClassification.classificationId = classification.id;
          songClassification.primary = primary;
          // This flag will only be true in the first iteration, turn it off for the rest of the items
          primary = false;
          this.existingSongClassifications.push(songClassification);
        }
      }
    }

    return metadata;
  }

  private processAlbumArtist(metadata: KeyValues): ArtistEntity {
    const artistType = this.reduce(metadata[OutputField.ArtistType]);
    const country = this.reduce(metadata[OutputField.Country]);
    const artistStylized = this.reduce(metadata[OutputField.ArtistStylized]);
    const artistSort = this.reduce(metadata[OutputField.ArtistSort]);

    let artistName = this.reduce(metadata[OutputField.AlbumArtist]);
    if (!artistName) {
      artistName = this.reduce(metadata[OutputField.Artist]);
      if (!artistName) {
        artistName = this.unknownValue;
      }
    }

    const newArtist = new ArtistEntity();
    newArtist.isNew = true;
    newArtist.name = artistName;
    newArtist.artistSort = artistSort ? artistSort : newArtist.name;
    newArtist.favorite = false;
    newArtist.artistTypeId = artistType ? this.getValueListEntryId(artistType, ValueLists.ArtistType.id, this.existingArtistTypes) : ValueLists.ArtistType.entries.Unknown;
    newArtist.countryId = country ? this.getValueListEntryId(country, ValueLists.Country.id, this.existingCountries) : ValueLists.Country.entries.Unknown;
    newArtist.artistStylized = artistStylized ? artistStylized : artistName;
    this.db.hashArtist(newArtist);

    const existingArtist = this.existingArtists.find(a => a.id === newArtist.id);
    if (existingArtist) {
      if (existingArtist.artistTypeId === ValueLists.ArtistType.entries.Unknown && existingArtist.artistTypeId !== newArtist.artistTypeId) {
        existingArtist.artistTypeId = newArtist.artistTypeId;
        if (!existingArtist.isNew) {
          existingArtist.hasChanges = true;
        }
      }
      if (existingArtist.countryId === ValueLists.Country.entries.Unknown && existingArtist.countryId !== newArtist.countryId) {
        existingArtist.countryId = newArtist.countryId;
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

    this.processImage(newArtist.id, metadata, OutputField.AlbumArtistImage);

    this.existingArtists.push(newArtist);
    return newArtist;
  }

  private processAlbum(artist: ArtistEntity, metadata: KeyValues, ignoredYears?: number[]): AlbumEntity {
    const newAlbum = new AlbumEntity();
    newAlbum.isNew = true;
    newAlbum.primaryArtist = artist;

    newAlbum.name = this.reduce(metadata[OutputField.Album]);
    if (!newAlbum.name) {
      newAlbum.name = this.unknownValue;
    }
    newAlbum.releaseYear = 0;
    const year = this.reduce(metadata[OutputField.Year]);
    if (year > 0 && !ignoredYears.includes(year)) {
      // Is this actually the album year? Album year and song year might be different.
      newAlbum.releaseYear = year;
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

    const albumSort = this.reduce(metadata[OutputField.AlbumSort]);
    if (albumSort) {
      newAlbum.albumSort = albumSort;
    }
    else {
      newAlbum.albumSort = newAlbum.name;
    }

    const albumType = this.reduce(metadata[OutputField.AlbumType]);
    newAlbum.albumTypeId = albumType ? this.getValueListEntryId(albumType, ValueLists.AlbumType.id, this.existingAlbumTypes) : ValueLists.AlbumType.entries.LP;

    newAlbum.favorite = false;

    this.processImage(newAlbum.id, metadata, OutputField.AlbumImage);
    this.processImage(newAlbum.id, metadata, OutputField.AlbumSecondaryImage);

    this.existingAlbums.push(newAlbum);
    return newAlbum;
  }

  private processSong(album: AlbumEntity, metadata: KeyValues): SongEntity {
    const song = new SongEntity();
    song.isNew = true;
    song.filePath = this.reduce(metadata[OutputField.FilePath]);

    const id = this.reduce(metadata[OutputField.UfId]);
    if (id) {
      song.externalId = id;
    }

    song.name = this.reduce(metadata[OutputField.Title]);
    if (!song.name) {
      song.name = this.reduce(metadata[OutputField.FileName]);
    }

    song.primaryAlbum = album;
    const trackNumber = this.reduce(metadata[OutputField.TrackNumber]);
    song.trackNumber = trackNumber ? trackNumber : 0;
    const mediaNumber = this.reduce(metadata[OutputField.MediaNumber]);
    song.mediaNumber = mediaNumber ? mediaNumber : 0;
    song.releaseYear = album.releaseYear;
    song.releaseDecade = album.releaseDecade;

    const composer = this.reduce(metadata[OutputField.Composer]);
    if (composer) {
      song.composer = composer;
    }
    const comment = this.reduce(metadata[OutputField.Comment]);
    if (comment) {
      song.comment = comment;
    }
    const grouping = this.reduce(metadata[OutputField.Grouping]);
    if (grouping) {
      song.grouping = grouping;
    }

    const addDate = this.reduce(metadata[OutputField.AddDate]);
    if (addDate) {
      song.addDate = addDate;
    }

    const changeDate = this.reduce(metadata[OutputField.ChangeDate]);
    if (changeDate) {
      song.changeDate = changeDate;
    }

    song.language = this.reduce(metadata[OutputField.Language]);
    if (!song.language) {
      song.language = this.unknownValue;
    }

    song.mood = this.reduce(metadata[OutputField.Mood]);
    if (!song.mood) {
      song.mood = this.unknownValue;
    }

    // Rating
    song.rating = 0;
    const rating = this.reduce(metadata[OutputField.Rating]);
    if (rating) {
      song.rating = rating;
    }

    // Play Count
    song.playCount = 0;
    const playCount = this.reduce(metadata[OutputField.PlayCount]);
    if (playCount) {
      song.playCount = playCount;
    }
    // This will only be set once just for tracking purposes
    song.initialPlayCount = song.playCount;

    let lyrics = this.reduce(metadata[OutputField.UnSyncLyrics]);
    if (!lyrics) {
      lyrics = this.reduce(metadata[OutputField.SyncLyrics]);
    }
    if (lyrics) {
      song.lyrics = lyrics;
    }

    const titleSort = this.reduce(metadata[OutputField.TitleSort]);
    if (titleSort) {
      song.titleSort = titleSort;
    }
    else {
      song.titleSort = song.name;
    }

    song.live = false;
    const live = this.reduce(metadata[OutputField.Live]);
    if (live && live.toLowerCase() === 'true') {
      song.live = true;
    }

    song.seconds = this.reduce(metadata[OutputField.Seconds]);
    if (!song.seconds) {
      console.log(metadata);
    }
    song.duration = this.utilities.secondsToMinutes(song.seconds);
    song.bitrate = this.reduce(metadata[OutputField.Bitrate]);
    song.frequency = this.reduce(metadata[OutputField.Frequency]);
    song.vbr = this.reduce(metadata[OutputField.Vbr]);
    song.replayGain = this.reduce(metadata[OutputField.ReplayGain]);
    song.fileSize = this.reduce(metadata[OutputField.FileSize]);
    song.fullyParsed = this.reduce(metadata[OutputField.TagFullyParsed]);
    song.favorite = false;

    this.db.hashSong(song);
    this.processImage(song.id, metadata, OutputField.SingleImage);
    return song;
  }

  private processImage(relatedId: string, metadata: KeyValues, field: OutputField): void {
    const image = this.reduce(metadata[field]) as IImageSource;

    if (image && image.sourcePath) {
      const existingImage = this.existingImages.find (i =>
        i.relatedId === relatedId &&
        i.sourceType === image.sourceType &&
        i.sourceIndex === image.sourceIndex &&
        i.sourcePath === image.sourcePath);

      if (!existingImage) {
        const newImage = new RelatedImageEntity();
        newImage.id = this.utilities.newGuid();
        newImage.name = this.getImageName(metadata, image.imageType as MusicImageType);
        newImage.relatedId = relatedId;
        newImage.sourcePath = image.sourcePath;
        newImage.sourceType = image.sourceType;
        newImage.sourceIndex = image.sourceIndex;
        newImage.imageType = image.imageType;
        newImage.mimeType = image.mimeType;
        newImage.isNew = true;
        this.existingImages.push(newImage);
      }
    }
  }

  private getImageName(metadata: KeyValues, imageType: MusicImageType): string {
    if (imageType === MusicImageType.Single) {
      const title = this.reduce(metadata[OutputField.Title]);
      if (title) {
        return title;
      }
      const fileName = this.reduce(metadata[OutputField.FileName]);
      if (fileName) {
        return fileName;
      }
    }

    if (imageType === MusicImageType.Front || imageType === MusicImageType.FrontAlternate) {
      const album = this.reduce(metadata[OutputField.Album]);
      if (album) {
        return album;
      }
    }

    if (imageType === MusicImageType.Artist) {
      const albumArtist = this.reduce(metadata[OutputField.AlbumArtist]);
      if (albumArtist) {
        return albumArtist;
      }
    }

    return this.unknownValue;
  }

  private processArtists(metadata: KeyValues, splitSymbols: string[]): ArtistEntity[] {
    // This is the list of artists that will be eventually associated with a song
    const result: ArtistEntity[] = [];

    const artists = metadata[OutputField.Artist];
    const artistSorts = metadata[OutputField.ArtistSort];

    if (!artists || !artists.length) {
      return result;
    }

    let artistIndex = 0;
    for (const artistName of artists) {
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
        if (!result.find(a => a.id === existingArtist.id)) {
          result.push(existingArtist);
        }
      }
      else {
        // First, add the artist as it is
        this.existingArtists.push(newArtist);
        result.push(newArtist);

        // Second, perform split if specified
        if (splitSymbols && splitSymbols.length) {
          for (const splitSymbol of splitSymbols) {
            const splitArtistNames = artistName.split(splitSymbol);
            for (const splitArtistName of splitArtistNames) {
              const newSplitArtist = this.createArtist(splitArtistName, splitArtistName);
              const existingSplitArtist = this.existingArtists.find(a => a.id === newSplitArtist.id);
              if (existingSplitArtist) {
                if (!result.find(a => a.id === existingSplitArtist.id)) {
                  result.push(existingSplitArtist);
                }
              }
              else {
                this.existingArtists.push(newSplitArtist);
                result.push(newSplitArtist);
              }
            }
          }
        }
      }
    }

    return result;
  }

  private createArtist(artistName: string, artistSort: string): ArtistEntity {
    const artist = new ArtistEntity();
    artist.isNew = true;
    artist.name = artistName;
    artist.artistStylized = artistName;
    artist.artistSort = artistSort;
    artist.favorite = false;
    artist.artistTypeId = ValueLists.ArtistType.entries.Unknown;
    artist.countryId = ValueLists.Country.entries.Unknown;
    this.db.hashArtist(artist);
    return artist;
  }

  private getValueListEntryId(entryName: string, valueListTypeId: string, entries: ValueListEntryEntity[]): string {
    const existingEntry = entries.find(e => e.name === entryName);
    if (existingEntry) {
      return existingEntry.id;
    }
    const newEntry = new ValueListEntryEntity();
    newEntry.id = this.utilities.newGuid();
    newEntry.valueListTypeId = valueListTypeId;
    newEntry.name = entryName;
    // TODO: specify proper sequence
    newEntry.sequence = 0;
    newEntry.isClassification = false;
    newEntry.isNew = true;
    entries.push(newEntry);
    return newEntry.id;
  }

  private processGenres(metadata: KeyValues, splitSymbols: string[]): ValueListEntryEntity[] {
    const result: ValueListEntryEntity[] = [];
    const genres = metadata[OutputField.Genre];
    if (genres?.length) {
      for (const genreName of genres) {
        // First process genres by splitting the values;
        // this is key since the very first genre will be marked as the primary genre of the song
        if (splitSymbols && splitSymbols.length) {
          for (const splitSymbol of splitSymbols) {
            const splitGenreNames = genreName.split(splitSymbol);
            for (const splitGenreName of splitGenreNames) {
              this.processGenre(splitGenreName, result);
            }
          }
        }
        // TODO: enable this as a module option
        // Finally process the genre as a whole value
        // this.processGenre(genreName, genres);
      }
    }
    return result;
  }

  private processGenre(name: string, genres: ValueListEntryEntity[]): void {
    const existingGenre = this.existingGenres.find(g => g.name === name);
    if (existingGenre) {
      if (!genres.find(g => g.name === existingGenre.name)) {
        genres.push(existingGenre);
      }
    }
    else {
      const newGenre = this.createGenre(name);
      this.existingGenres.push(newGenre);
      genres.push(newGenre);
    }
  }

  private createGenre(name: string): ValueListEntryEntity {
    const genre = new ValueListEntryEntity();
    genre.id = this.utilities.newGuid();
    genre.isNew = true;
    genre.name = name;
    genre.isClassification = true;
    genre.valueListTypeId = ValueLists.Genre.id;
    // TODO: determine how to specify the proper sequence
    genre.sequence = 0;
    return genre;
  }

  private processClassifications(metadata: KeyValues): ValueListEntryEntity[] {
    const result: ValueListEntryEntity[] = [];

    const classifications = metadata[OutputField.Classification];
    if (!classifications || !classifications.length) {
      return result;
    }

    for (const classData of classifications) {
      const classDataArray = classData.split('|');
      if (classDataArray.length !== 2) {
        continue;
      }
      const classTypeName = classDataArray[0];
      // We don't support adding class types in the scan process.
      // The type has to exist in order to add the classification.
      const classType = this.existingClassTypes.find(item => item.name === classTypeName);
      const classificationNames = classDataArray[1];
      if (classType && classificationNames) {
        const names = classificationNames.split(',');
        for (const name of names) {
          const newClassification = new ValueListEntryEntity();
          newClassification.id = this.utilities.newGuid();
          newClassification.isNew = true;
          newClassification.name = name;
          newClassification.valueListTypeId = classType.id;
          newClassification.isClassification = true;
          // TODO: determine how to specify the proper sequence
          newClassification.sequence = 0;

          const existingGlobalClass = this.existingClassifications.find(c =>
            c.name === newClassification.name && c.valueListTypeId === newClassification.valueListTypeId);
          if (existingGlobalClass) {
            const existingLocalClassification = result.find(c =>
              c.name === existingGlobalClass.name && c.valueListTypeId === existingGlobalClass.valueListTypeId);
            if (!existingLocalClassification) {
              result.push(existingGlobalClass);
            }
          }
          else {
            this.existingClassifications.push(newClassification);
            result.push(newClassification);
          }
        }
      }
    }
    return result;
  }

  public async processPlaylistFile(fileInfo: IFileInfo): Promise<any> {
    const fileContent = await this.fileService.getText(fileInfo.path);
    // Remove \r and then split by \n
    const fileLines = fileContent.replace(/(\r)/gm, '').split('\n');
    if (fileLines.length) {
      let tracks: PlaylistSongEntity[];
      const firstLine = fileLines[0].toUpperCase();

      if (firstLine === '[PLAYLIST]') {
        const playlist = await this.createPlaylist(fileInfo.name);
        if (playlist) {
          tracks = await this.processPls(playlist, fileInfo, fileLines);
        }
      } else if (firstLine === '#EXTM3U') {
        const playlist = await this.createPlaylist(fileInfo.name);
        if (playlist) {
          tracks = await this.processM3u(playlist, fileInfo, fileLines);
        }
      }

      if (tracks && tracks.length) {
        this.db.bulkInsert(PlaylistSongEntity, tracks);
      }
    }

    return null;
  }

  private async createPlaylist(name: string): Promise<PlaylistEntity> {
    const playlist = new PlaylistEntity();
    playlist.name = name;
    playlist.favorite = false;
    playlist.imported = true;
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

  private async processPls(playlist: PlaylistEntity, fileInfo: IFileInfo, lines: string[]): Promise<PlaylistSongEntity[]> {
    const tracks: PlaylistSongEntity[] = [];
    let trackSequence = 1;
    for (const line of lines) {
      if (line.toLowerCase().startsWith('file')) {
        const lineParts = line.split('=');
        if (lineParts.length > 1) {
          // TODO: validate proper audio extension
          const relativeFilePath = lineParts[1];
          const playlistSong = await this.createPlaylistSong(playlist, fileInfo.directoryPath, relativeFilePath, trackSequence);
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

  private reduce<T>(array: T[]): T {
    if (array && array.length) {
      return array[0];
    }
    return null;
  }
}
