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
import { MetadataReaderService } from 'src/app/mapping/data-transform/metadata-reader.service';
import { IImageSource, KeyValues } from 'src/app/core/models/core.interface';
import { MetaField } from 'src/app/mapping/data-transform/data-transform.enum';

export enum ScanFileMode {
  /** Mode where the scanner identifies a new audio file and it will be added to the database. */
  Add = 'add',
  /**
   * Mode where the scanner identifies the file already exists in the database but it needs to be updated.
   * Changes allowed in update mode:
   * Add/update lyrics and images.
   * Update this information: vbr, size, freq, bitrate, seconds, duration, layer, level, channel mode, changeDate.
   * Keep older add date in the file.
   */
  Update = 'update',
  /** Mode where the scanner identifies the file already exists in the database and doesn't need any changes. */
  Skip = 'skip'
}

@Injectable({
  providedIn: 'root'
})
export class ScanService {

  private unknownValue = 'Unknown';
  private scanMode: ScanFileMode;
  private songToProcess: SongEntity;
  private options: ModuleOptionEntity[];


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
      await this.db.bulkUpdate(ArtistEntity, artistsToBeUpdated, ['artistTypeId', 'artistSort', 'artistStylized', 'countryId']);
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
    const songsToBeUpdated = this.existingSongs.filter(song => song.hasChanges);
    if (songsToBeUpdated.length) {
      const updateColumns = ['lyrics', 'seconds', 'bitrate', 'frequency', 'vbr', 'replayGain', 'fileSize', 'addDate', 'changeDate', 'replaceDate'];
      await this.db.bulkUpdate(SongEntity, songsToBeUpdated, updateColumns);
      songsToBeUpdated.forEach(s => s.hasChanges = false);
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
    moduleOptions: ModuleOptionEntity[],
    beforeFileProcess?: (count: number, fileInfo: IFileInfo) => Promise<void>,
    beforeSyncChanges?: () => Promise<void>,
  ): Promise<KeyValues[]> {
    this.options = moduleOptions?.length ? moduleOptions : [];
    await this.beforeProcess();
    let fileCount = 0;
    const result: KeyValues[] = [];
    for (const file of files) {
      fileCount++;
      if (beforeFileProcess) {
        await beforeFileProcess(fileCount, file);
      }
      this.setMode(file);
      const metadata = await this.processAudioFile(file);
      result.push(metadata);
    }

    if (beforeSyncChanges) {
      await beforeSyncChanges();
    }
    await this.syncChangesToDatabase();
    return result;
  }

  private setMode(fileInfo: IFileInfo): void {
    this.songToProcess = this.existingSongs.find(s => s.filePath === fileInfo.path);
    if (this.songToProcess) {
      const fileAddTime = fileInfo.addDate.getTime();
      const dbAddTime = this.songToProcess.addDate.getTime();
      const fileChangeTime = fileInfo.changeDate.getTime();
      const dbChangeTime = this.songToProcess.changeDate.getTime();
      // We need timestamps to use the equal operator with dates
      if (fileAddTime === dbAddTime && fileChangeTime === dbChangeTime) {
        this.scanMode = ScanFileMode.Skip;
      }
      // TODO: if lyrics file or images files changed also set update mode
      else {
        // We are assuming the file was replaced or updated,
        // so we need to update the record with the new info
        if (fileAddTime < dbAddTime || fileChangeTime < dbChangeTime) {
          // This should only happen if something deliberately updated the dates
          // to an older value, so just log it as warning
          this.log.warn('Found file with older change date.', {
            filePath: fileInfo.path,
            fileAddDate: fileInfo.addDate,
            dbAddDate: this.songToProcess.addDate,
            fileChangeDate: fileInfo.changeDate,
            dbChangeDate: this.songToProcess.changeDate
          });
        }
        this.scanMode = ScanFileMode.Update;
      }
    }
    else {
      this.scanMode = ScanFileMode.Add;
    }
  }

  private async processAudioFile(fileInfo: IFileInfo): Promise<KeyValues> {
    if (this.scanMode === ScanFileMode.Skip) {
      return {
        [MetaField.FileMode]: [this.scanMode],
        [MetaField.Error]: []
      };
    }

    const metadata = await this.metadataReader.process(fileInfo);
    metadata[MetaField.FileMode] = [this.scanMode];

    let errors = metadata[MetaField.Error];
    if (!errors) {
      errors = metadata[MetaField.Error] = [];
    }
    if (errors.length) {
      return metadata;
    }

    if (this.scanMode === ScanFileMode.Update) {
      return this.updateAudioFile(metadata);
    }

    return this.addAudioFile(metadata);
  }

  private async addAudioFile(metadata: KeyValues): Promise<KeyValues> {
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
    const genreSplitOption = this.options.find(option => option.name === ModuleOptionName.GenreSplitCharacters);
    if (genreSplitOption) {
      genreSplitSymbols = this.db.getOptionArrayValue(genreSplitOption);
    }
    const genres = this.processGenres(metadata, genreSplitSymbols);

    // CLASSIFICATIONS
    const classifications = this.processClassifications(metadata);

    // SONG - ARTISTS/GENRES/CLASSIFICATIONS
    this.songToProcess = this.processSong(primaryAlbum, metadata);
    if (genres.length) {
      // Set the first genre found as the main genre
      this.songToProcess.genre = genres[0].name;
    }
    // Make sure the primary artist is part of the song artists
    if (!artists.find(a => a.id === primaryArtist.id)) {
      artists.push(primaryArtist);
    }

    if (this.existingSongs.find(s => s.id === this.songToProcess.id)) {
      // TODO: if the song already exists, update data
    }
    else {
      this.existingSongs.push(this.songToProcess);

      // If we are adding a new song, all its artists are new as well, so push them to cache
      for (const artist of artists) {
        const songArtist = new SongArtistEntity();
        songArtist.songId = this.songToProcess.id;
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
          songClassification.songId = this.songToProcess.id;
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

  private async updateAudioFile(metadata: KeyValues): Promise<KeyValues> {
    // Lyrics
    let lyrics = this.reduce(metadata[MetaField.UnSyncLyrics]);
    if (!lyrics) {
      lyrics = this.reduce(metadata[MetaField.SyncLyrics]);
    }
    if (lyrics && lyrics !== this.songToProcess.lyrics) {
      this.songToProcess.lyrics = lyrics;
      this.songToProcess.hasChanges = true;
    }

    // Replaced?
    let replaced = false;
    const seconds = this.reduce(metadata[MetaField.Seconds]);
    if (seconds && seconds !== this.songToProcess.seconds) {
      this.songToProcess.seconds = seconds;
      this.songToProcess.duration = this.utilities.secondsToMinutes(seconds);
      replaced = true;
    }
    const bitrate = this.reduce(metadata[MetaField.Bitrate]);
    if (bitrate && bitrate !== this.songToProcess.bitrate) {
      this.songToProcess.bitrate = bitrate;
      replaced = true;
    }
    const frequency = this.reduce(metadata[MetaField.Frequency]);
    if (frequency && frequency !== this.songToProcess.frequency) {
      this.songToProcess.frequency = frequency;
      replaced = true;
    }
    const vbr = metadata[MetaField.Vbr];
    if (vbr?.length && vbr[0] !== this.songToProcess.vbr) {
      this.songToProcess.vbr = vbr[0];
      replaced = true;
    }
    const replayGain = this.reduce(metadata[MetaField.ReplayGain]);
    if (replayGain && replayGain !== this.songToProcess.replayGain) {
      this.songToProcess.replayGain = replayGain;
      replaced = true;
    }
    const fileSize = this.reduce(metadata[MetaField.FileSize]);
    if (fileSize && fileSize !== this.songToProcess.fileSize) {
      this.songToProcess.fileSize = fileSize;
      replaced = true;
    }
    // const fullyParsed = metadata[MetaField.TagFullyParsed];
    // if (fullyParsed?.length && fullyParsed[0] !== this.songToProcess.fullyParsed) {
    //   this.songToProcess.fullyParsed = fullyParsed[0];
    //   replaced = true;
    // }

    // Add date
    let newAddDate = this.reduce(metadata[MetaField.AddDate]);
    if (!newAddDate) {
      newAddDate = new Date();
    }
    let newChangeDate = this.reduce(metadata[MetaField.ChangeDate]);
    if (!newChangeDate) {
      newChangeDate = new Date();
    }
    // TODO: also use the metadata change date?


    if (newAddDate > newChangeDate) {
      newAddDate = newChangeDate;
    }
    if (this.songToProcess.addDate > newAddDate) {
      this.songToProcess.addDate = newAddDate;
      this.songToProcess.hasChanges = true;
    }

    if (this.songToProcess.hasChanges) {
      this.songToProcess.changeDate = new Date();
    }

    if (replaced) {
      this.songToProcess.replaceDate = new Date();
      // We want to notify the process this file changed but prevent changing the changeDate
      // if other properties didn't change so that's why we have this line after validating hasChanges
      this.songToProcess.hasChanges = true;
    }

    // Images
    const existingAlbum = this.existingAlbums.find(a => a.id === this.songToProcess.primaryAlbumId);
    this.processImage(existingAlbum.primaryArtistId, metadata, MetaField.ArtistImage);
    this.processImage(this.songToProcess.primaryAlbumId, metadata, MetaField.AlbumImage);
    this.processImage(this.songToProcess.primaryAlbumId, metadata, MetaField.AlbumSecondaryImage);
    this.processImage(this.songToProcess.id, metadata, MetaField.SingleImage);
    return metadata;
  }

  private processAlbumArtist(metadata: KeyValues): ArtistEntity {
    const artistType = this.reduce(metadata[MetaField.ArtistType]);
    const country = this.reduce(metadata[MetaField.Country]);
    const artistStylized = this.reduce(metadata[MetaField.ArtistStylized]);
    const artistSort = this.reduce(metadata[MetaField.ArtistSort]);

    let artistName = this.reduce(metadata[MetaField.AlbumArtist]);
    if (!artistName) {
      artistName = this.reduce(metadata[MetaField.Artist]);
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

    this.processImage(newArtist.id, metadata, MetaField.AlbumArtistImage);

    this.existingArtists.push(newArtist);
    return newArtist;
  }

  private processAlbum(artist: ArtistEntity, metadata: KeyValues, ignoredYears?: number[]): AlbumEntity {
    const newAlbum = new AlbumEntity();
    newAlbum.isNew = true;
    newAlbum.primaryArtist = artist;

    newAlbum.name = this.reduce(metadata[MetaField.Album]);
    if (!newAlbum.name) {
      newAlbum.name = this.unknownValue;
    }
    newAlbum.releaseYear = 0;
    const year = this.reduce(metadata[MetaField.Year]);
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

    const albumSort = this.reduce(metadata[MetaField.AlbumSort]);
    if (albumSort) {
      newAlbum.albumSort = albumSort;
    }
    else {
      newAlbum.albumSort = newAlbum.name;
    }

    const albumType = this.reduce(metadata[MetaField.AlbumType]);
    newAlbum.albumTypeId = albumType ? this.getValueListEntryId(albumType, ValueLists.AlbumType.id, this.existingAlbumTypes) : ValueLists.AlbumType.entries.LP;

    newAlbum.favorite = false;

    this.processImage(newAlbum.id, metadata, MetaField.AlbumImage);
    this.processImage(newAlbum.id, metadata, MetaField.AlbumSecondaryImage);

    this.existingAlbums.push(newAlbum);
    return newAlbum;
  }

  private processSong(album: AlbumEntity, metadata: KeyValues): SongEntity {
    const song = new SongEntity();
    song.isNew = true;
    song.filePath = this.reduce(metadata[MetaField.FilePath]);

    const id = this.reduce(metadata[MetaField.UfId]);
    if (id) {
      song.externalId = id;
    }

    song.name = this.reduce(metadata[MetaField.Title]);
    if (!song.name) {
      song.name = this.reduce(metadata[MetaField.FileName]);
    }

    song.primaryAlbum = album;
    const trackNumber = this.reduce(metadata[MetaField.TrackNumber]);
    song.trackNumber = trackNumber ? trackNumber : 0;
    const mediaNumber = this.reduce(metadata[MetaField.MediaNumber]);
    song.mediaNumber = mediaNumber ? mediaNumber : 0;
    song.releaseYear = album.releaseYear;
    song.releaseDecade = album.releaseDecade;

    const composer = this.reduce(metadata[MetaField.Composer]);
    if (composer) {
      song.composer = composer;
    }
    const comment = this.reduce(metadata[MetaField.Comment]);
    if (comment) {
      song.comment = comment;
    }
    const grouping = this.reduce(metadata[MetaField.Grouping]);
    if (grouping) {
      song.grouping = grouping;
    }

    // Get dates
    let addDate = this.reduce(metadata[MetaField.AddDate]);
    if (!addDate) {
      addDate = new Date();
    }
    let changeDate = this.reduce(metadata[MetaField.ChangeDate]);
    if (!changeDate) {
      changeDate = new Date();
    }
    // Grab the oldest date as the add date
    if (addDate > changeDate) {
      addDate = changeDate;
    }
    // Set dates in db
    song.addDate = addDate;
    song.changeDate = changeDate;
    // TODO: Set dates in file

    song.language = this.reduce(metadata[MetaField.Language]);
    if (!song.language) {
      song.language = this.unknownValue;
    }

    song.mood = this.reduce(metadata[MetaField.Mood]);
    if (!song.mood) {
      song.mood = this.unknownValue;
    }

    // Rating
    song.rating = 0;
    const rating = this.reduce(metadata[MetaField.Rating]);
    if (rating) {
      song.rating = rating;
    }

    // Play Count
    song.playCount = 0;
    const playCount = this.reduce(metadata[MetaField.PlayCount]);
    if (playCount) {
      song.playCount = playCount;
    }
    // This will only be set once just for tracking purposes
    song.initialPlayCount = song.playCount;

    let lyrics = this.reduce(metadata[MetaField.UnSyncLyrics]);
    if (!lyrics) {
      lyrics = this.reduce(metadata[MetaField.SyncLyrics]);
    }
    if (lyrics) {
      song.lyrics = lyrics;
    }

    const titleSort = this.reduce(metadata[MetaField.TitleSort]);
    if (titleSort) {
      song.titleSort = titleSort;
    }
    else {
      song.titleSort = song.name;
    }

    song.live = false;
    const live = this.reduce(metadata[MetaField.Live]);
    if (live && live.toLowerCase() === 'true') {
      song.live = true;
    }

    song.seconds = this.reduce(metadata[MetaField.Seconds]);
    if (!song.seconds) {
      song.seconds = 0;
      this.log.warn('Duration not found for: ' + song.filePath);
    }
    song.duration = this.utilities.secondsToMinutes(song.seconds);
    song.bitrate = this.reduce(metadata[MetaField.Bitrate]);
    song.frequency = this.reduce(metadata[MetaField.Frequency]);
    song.vbr = this.reduce(metadata[MetaField.Vbr]);
    song.replayGain = this.reduce(metadata[MetaField.ReplayGain]);
    song.fileSize = this.reduce(metadata[MetaField.FileSize]);
    song.fullyParsed = this.reduce(metadata[MetaField.TagFullyParsed]);
    song.favorite = false;

    this.db.hashSong(song);
    this.processImage(song.id, metadata, MetaField.SingleImage);
    return song;
  }

  private processImage(relatedId: string, metadata: KeyValues, field: MetaField): void {
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
      const title = this.reduce(metadata[MetaField.Title]);
      if (title) {
        return title;
      }
      const fileName = this.reduce(metadata[MetaField.FileName]);
      if (fileName) {
        return fileName;
      }
    }

    if (imageType === MusicImageType.Front || imageType === MusicImageType.FrontAlternate) {
      const album = this.reduce(metadata[MetaField.Album]);
      if (album) {
        return album;
      }
    }

    if (imageType === MusicImageType.Artist) {
      const albumArtist = this.reduce(metadata[MetaField.AlbumArtist]);
      if (albumArtist) {
        return albumArtist;
      }
    }

    return this.unknownValue;
  }

  private processArtists(metadata: KeyValues, splitSymbols: string[]): ArtistEntity[] {
    // This is the list of artists that will be eventually associated with a song
    const result: ArtistEntity[] = [];

    const artists = metadata[MetaField.Artist];
    const artistSorts = metadata[MetaField.ArtistSort];

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
    const genres = metadata[MetaField.Genre];
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

    const classifications = metadata[MetaField.Classification];
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
