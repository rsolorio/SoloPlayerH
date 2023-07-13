import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { In, Not } from 'typeorm';
import {
  ArtistEntity,
  AlbumEntity,
  SongEntity,
  PlaylistEntity,
  PlaylistSongEntity,
  ModuleOptionEntity,
  SongClassificationEntity,
  ValueListEntryEntity,
  RelatedImageEntity,
  PlayHistoryEntity,
  AlbumViewEntity,
  ArtistViewEntity,
  PartyRelationEntity,
  ComposerViewEntity,
  DbEntity
} from '../../entities';
import { AppEvent } from '../../models/events.enum';
import { ModuleOptionName } from '../../models/module-option.enum';
import { ValueLists } from '../database/database.lists';
import { DatabaseService } from '../database/database.service';
import { IFileInfo } from '../../../platform/file/file.interface';
import { FileService } from '../../../platform/file/file.service';
import { MusicImageSourceType, MusicImageType } from '../../../platform/audio-metadata/audio-metadata.enum';
import { MetadataReaderService } from 'src/app/mapping/data-transform/metadata-reader.service';
import { IImageSource, KeyValues } from 'src/app/core/models/core.interface';
import { MetaField } from 'src/app/mapping/data-transform/data-transform.enum';
import { Criteria, CriteriaItem } from '../criteria/criteria.class';
import { ISyncInfo } from './scan.interface';
import { PartyRelationType } from '../../models/music.enum';
import { DatabaseLookupService } from '../database/database-lookup.service';
import { DatabaseEntitiesService } from '../database/database-entities.service';

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
  private genreSplitSymbols: string[];

  private existingArtists: ArtistEntity[];
  private existingAlbums: AlbumEntity[];
  private existingClassTypes: ValueListEntryEntity[];
  private existingGenres: ValueListEntryEntity[];
  private existingClassifications: ValueListEntryEntity[];
  private existingCountries: ValueListEntryEntity[];
  private existingArtistTypes: ValueListEntryEntity[];
  private existingAlbumTypes: ValueListEntryEntity[];
  private existingSongs: SongEntity[];
  private existingPartyRelations: PartyRelationEntity[];
  private existingSongClassifications: SongClassificationEntity[];
  private existingImages: RelatedImageEntity[];

  constructor(
    private fileService: FileService,
    private metadataReader: MetadataReaderService,
    private utilities: UtilityService,
    private db: DatabaseService,
    private entityService: DatabaseEntitiesService,
    private lookupService: DatabaseLookupService,
    private events: EventsService,
    private log: LogService) { }

  scan(folderPaths: string[], extension: string): Promise<IFileInfo[]> {
    return new Promise(resolve => {
      const files: IFileInfo[] = [];
      this.fileService.getFiles(folderPaths).subscribe({
        next: fileInfo => {
          if (fileInfo.extension.toLowerCase() === extension.toLowerCase()) {
            const existingFile = files.find(f => f.path === fileInfo.path);
            if (!existingFile) {
              files.push(fileInfo);
              this.events.broadcast(AppEvent.ScanFile, fileInfo);
            }
          }
        },
        complete: () => {
          resolve(files);
        }
      });
    });
  }

  /** Initializes cache variables and the metadata reader. */
  private async beforeProcess(): Promise<void> {
    // Prepare global variables
    this.existingArtists = await ArtistEntity.find();
    this.existingAlbums = await AlbumEntity.find();
    this.existingClassTypes = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.ClassificationType.id });
    // Do not include genre as a class type since it is handled separately
    this.existingClassTypes = this.existingClassTypes.filter(classType => classType.id !== ValueLists.Genre.id);
    // Do not include genres as classifications
    this.existingClassifications = await ValueListEntryEntity.findBy({ isClassification: true, valueListTypeId: Not(ValueLists.Genre.id) });
    this.existingGenres = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.Genre.id });
    this.existingCountries = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.Country.id });
    this.existingArtistTypes = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.ArtistType.id });
    this.existingAlbumTypes = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.AlbumType.id });
    this.existingSongs = await SongEntity.find();
    this.existingImages = await RelatedImageEntity.find();
    // These two entities are only used when adding new songs which means matching records will not previously exist in the db,
    // so we don't need to cache data from the db
    this.existingPartyRelations = [];
    this.existingSongClassifications = [];

    const genreSplitOption = this.lookupService.findModuleOption(ModuleOptionName.GenreSplitCharacters, this.options);
    if (genreSplitOption) {
      this.genreSplitSymbols = this.entityService.getOptionArrayValue(genreSplitOption);
    }

    // Prepare reader, clarify that classification types will be handled as dynamic fields
    // TODO: how to exclude class types already handled: Genre, Language
    await this.metadataReader.init({ dynamicFields: this.existingClassTypes.map(c => c.name) });
  }

  private async syncChangesToDatabase(syncInfo: ISyncInfo): Promise<void> {
    // TODO: determine if we really need to clear the isNew flag on all entities
    // There are a few places where the new flag is still used after this routine
    // Value lists
    const newCountries = this.existingCountries.filter(country => country.isNew);
    if (newCountries.length) {
      await this.db.bulkInsert(ValueListEntryEntity, newCountries);
      //newCountries.forEach(c => c.isNew = false);
    }
    // Artists
    const newArtists = this.existingArtists.filter(artist => artist.isNew);
    if (newArtists.length) {
      await this.db.bulkInsert(ArtistEntity, newArtists);
      //newArtists.forEach(a => a.isNew = false);
    }
    const artistsToBeUpdated = this.existingArtists.filter(artist => artist.hasChanges);
    if (artistsToBeUpdated.length) {
      const artistUpdateColumns = ['artistTypeId', 'artistSort', 'artistStylized', 'countryId'];
      await this.db.bulkUpdate(ArtistEntity, artistsToBeUpdated, artistUpdateColumns);
      //artistsToBeUpdated.forEach(a => a.hasChanges = false);
    }
    // Albums
    const newAlbums = this.existingAlbums.filter(album => album.isNew);
    if (newAlbums.length) {
      await this.db.bulkInsert(AlbumEntity, newAlbums);
      //newAlbums.forEach(a => a.isNew = false);
    }
    // Genres
    const newGenres = this.existingGenres.filter(genre => genre.isNew);
    if (newGenres.length) {
      await this.db.bulkInsert(ValueListEntryEntity, newGenres);
      //newGenres.forEach(g => g.isNew = false);
    }
    // Classifications
    const newClassifications = this.existingClassifications.filter(classification => classification.isNew);
    if (newClassifications.length) {
      await this.db.bulkInsert(ValueListEntryEntity, newClassifications);
      //newClassifications.forEach(c => c.isNew = false);
    }
    // Songs
    syncInfo.songAddedRecords = this.existingSongs.filter(song => song.isNew);
    if (syncInfo.songAddedRecords.length) {
      await this.db.bulkInsert(SongEntity, syncInfo.songAddedRecords);
      // newSongs.forEach(s => s.isNew = false);
    }
    syncInfo.songUpdatedRecords = this.existingSongs.filter(song => song.hasChanges);
    if (syncInfo.songUpdatedRecords.length) {
      const songUpdateColumns = ['lyrics', 'seconds', 'bitrate', 'frequency', 'vbr', 'replayGain', 'fileSize', 'addDate', 'changeDate', 'replaceDate'];
      await this.db.bulkUpdate(SongEntity, syncInfo.songUpdatedRecords, songUpdateColumns);
      // songsToBeUpdated.forEach(s => s.hasChanges = false);
    }
    // All records for party relation and song classifications should be new
    // PartyRelation
    await this.db.bulkInsert(PartyRelationEntity, this.existingPartyRelations);
    // SongClassifications
    await this.db.bulkInsert(SongClassificationEntity, this.existingSongClassifications);
    
    // Images
    const newImages = this.existingImages.filter(image => image.isNew);
    if (newImages.length) {
      await this.db.bulkInsert(RelatedImageEntity, newImages);
      //newImages.forEach(i => i.isNew = false);
    }
  }

  public async syncAudioFiles(
    files: IFileInfo[],
    moduleOptions: ModuleOptionEntity[],
    beforeFileProcess?: (count: number, fileInfo: IFileInfo) => Promise<void>,
    beforeSyncChanges?: () => Promise<void>,
    beforeCleanup?: () => Promise<void>
  ): Promise<ISyncInfo> {
    const result: ISyncInfo = {
      songInitialCount: 0,
      songFinalCount: 0,
      songAddedRecords: null,
      songUpdatedRecords: null,
      songSkippedRecords: null,
      songDeletedRecords: null,
      metadataResults: null
    };
    this.options = moduleOptions?.length ? moduleOptions : [];
    await this.beforeProcess();
    result.songInitialCount = this.existingSongs.length;
    let fileCount = 0;
    result.metadataResults = [];
    for (const file of files) {
      fileCount++;
      if (beforeFileProcess) {
        await beforeFileProcess(fileCount, file);
      }
      this.setMode(file);
      const metadata = await this.processAudioFile(file);
      result.metadataResults.push(metadata);
    }


    if (beforeSyncChanges) {
      await beforeSyncChanges();
    }
    await this.syncChangesToDatabase(result);

    if (beforeCleanup) {
      await beforeCleanup();
    }
    await this.cleanUpDatabase(result);
    result.songFinalCount = result.songAddedRecords.length + result.songUpdatedRecords.length + result.songSkippedRecords.length - result.songDeletedRecords.length;
    this.cleanUpMemory();
    return result;
  }

  private setMode(fileInfo: IFileInfo): void {
    this.songToProcess = this.lookupService.findSong(fileInfo.path, this.existingSongs);
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
    // PRIMARY ALBUM ARTIST
    const primaryArtist = this.processAlbumArtist(metadata);

    // MULTIPLE ARTISTS
    const artists = this.processArtists(metadata, []);

    // PRIMARY ALBUM
    // Hack for SoloSoft: ignore 1900
    const primaryAlbum = this.processAlbum(primaryArtist, metadata, [1900]);

    // GENRES
    // TODO: add default genre if no one found
    const genres = this.processGenres(metadata, this.genreSplitSymbols);

    // CLASSIFICATIONS
    const classifications = this.processClassifications(metadata);

    // MAIN SONG
    this.songToProcess = this.processSong(primaryAlbum, metadata);
    // Add the new song
    this.existingSongs.push(this.songToProcess);

    // PARTY RELATIONS
    this.processArtistRelations(metadata, primaryArtist, artists);

    // SONG/CLASSIFICATIONS
    if (genres.length) {
      // Set the first genre found as the main genre
      this.songToProcess.genre = genres[0].name;
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

    return metadata;
  }

  private async updateAudioFile(metadata: KeyValues): Promise<KeyValues> {
    // Lyrics
    let lyrics = this.first(metadata[MetaField.UnSyncLyrics]);
    if (!lyrics) {
      lyrics = this.first(metadata[MetaField.SyncLyrics]);
    }
    if (lyrics && lyrics !== this.songToProcess.lyrics) {
      this.songToProcess.lyrics = lyrics;
      this.songToProcess.hasChanges = true;
    }

    // Replaced?
    let replaced = false;
    const seconds = this.first(metadata[MetaField.Seconds]);
    if (seconds && seconds !== this.songToProcess.seconds) {
      this.songToProcess.seconds = seconds;
      this.songToProcess.duration = this.utilities.secondsToMinutes(seconds);
      replaced = true;
    }
    const bitrate = this.first(metadata[MetaField.Bitrate]);
    if (bitrate && bitrate !== this.songToProcess.bitrate) {
      this.songToProcess.bitrate = bitrate;
      replaced = true;
    }
    const frequency = this.first(metadata[MetaField.Frequency]);
    if (frequency && frequency !== this.songToProcess.frequency) {
      this.songToProcess.frequency = frequency;
      replaced = true;
    }
    const vbr = metadata[MetaField.Vbr];
    if (vbr?.length && vbr[0] !== this.songToProcess.vbr) {
      this.songToProcess.vbr = vbr[0];
      replaced = true;
    }
    const replayGain = this.first(metadata[MetaField.ReplayGain]);
    if (replayGain && replayGain !== this.songToProcess.replayGain) {
      this.songToProcess.replayGain = replayGain;
      replaced = true;
    }
    const fileSize = this.first(metadata[MetaField.FileSize]);
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
    let newAddDate = this.first(metadata[MetaField.AddDate]);
    if (!newAddDate) {
      newAddDate = new Date();
    }
    let newChangeDate = this.first(metadata[MetaField.ChangeDate]);
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
    let artistName = this.first(metadata[MetaField.AlbumArtist]);
    if (!artistName) {
      artistName = this.first(metadata[MetaField.Artist]);
      if (!artistName) {
        artistName = this.unknownValue;
      }
    }

    const artistType = this.first(metadata[MetaField.ArtistType]);
    const country = this.first(metadata[MetaField.Country]);
    const artistStylized = this.first(metadata[MetaField.ArtistStylized]);
    const artistSort = this.first(metadata[MetaField.ArtistSort]);

    const newArtist = new ArtistEntity();
    newArtist.name = artistName;
    newArtist.artistSort = artistSort ? artistSort : newArtist.name;
    newArtist.artistTypeId = artistType ? this.getValueListEntryId(artistType, ValueLists.ArtistType.id, this.existingArtistTypes) : ValueLists.ArtistType.entries.Unknown;
    newArtist.countryId = country ? this.getValueListEntryId(country, ValueLists.Country.id, this.existingCountries) : ValueLists.Country.entries.Unknown;
    newArtist.artistStylized = artistStylized ? artistStylized : artistName;

    const existingArtist = this.lookupService.findArtist(newArtist.name, this.existingArtists);
    if (existingArtist) {
      if (existingArtist.artistTypeId === ValueLists.ArtistType.entries.Unknown && existingArtist.artistTypeId !== newArtist.artistTypeId) {
        existingArtist.artistTypeId = newArtist.artistTypeId;
        this.setChangesIfNotNew(existingArtist);
      }
      if (existingArtist.countryId === ValueLists.Country.entries.Unknown && existingArtist.countryId !== newArtist.countryId) {
        existingArtist.countryId = newArtist.countryId;
        this.setChangesIfNotNew(existingArtist);
      }
      if (existingArtist.artistStylized === existingArtist.name && existingArtist.artistStylized !== newArtist.artistStylized) {
        existingArtist.artistStylized = newArtist.artistStylized;
        this.setChangesIfNotNew(existingArtist);
      }
      if (existingArtist.artistSort === existingArtist.name && existingArtist.artistSort !== newArtist.artistSort) {
        existingArtist.artistSort = newArtist.artistSort;
        this.setChangesIfNotNew(existingArtist);
      }
      return existingArtist;
    }

    newArtist.isNew = true;
    newArtist.id = this.utilities.newGuid();
    newArtist.favorite = false;
    newArtist.hash = this.lookupService.hashArtist(newArtist.name);
    this.processImage(newArtist.id, metadata, MetaField.AlbumArtistImage);
    this.existingArtists.push(newArtist);
    return newArtist;
  }

  private processAlbum(artist: ArtistEntity, metadata: KeyValues, ignoredYears?: number[]): AlbumEntity {
    const newAlbum = new AlbumEntity();
    newAlbum.name = this.first(metadata[MetaField.Album]);
    if (!newAlbum.name) {
      newAlbum.name = this.unknownValue;
    }

    newAlbum.releaseYear = 0;
    const year = this.first(metadata[MetaField.Year]);
    if (year > 0 && !ignoredYears.includes(year)) {
      // Is this actually the album year? Album year and song year might be different.
      newAlbum.releaseYear = year;
    }

    let albumStylized = this.first(metadata[MetaField.AlbumStylized]);
    if (!albumStylized) {
      albumStylized = newAlbum.name;
    }
    newAlbum.albumStylized = albumStylized;

    const albumSort = this.first(metadata[MetaField.AlbumSort]);
    if (albumSort) {
      newAlbum.albumSort = albumSort;
    }
    else {
      newAlbum.albumSort = newAlbum.name;
    }

    const existingAlbum = this.lookupService.findAlbum(newAlbum.name, newAlbum.releaseYear, artist.id, this.existingAlbums);
    if (existingAlbum) {
      // Use the latest song year to set the album year
      if (existingAlbum.releaseYear < newAlbum.releaseYear) {
        existingAlbum.releaseYear = newAlbum.releaseYear;
        this.setChangesIfNotNew(existingAlbum);
      }
      if (existingAlbum.albumStylized === existingAlbum.name && existingAlbum.albumStylized !== newAlbum.albumStylized) {
        existingAlbum.albumStylized = newAlbum.albumStylized;
        this.setChangesIfNotNew(existingAlbum);
      }
      if (existingAlbum.albumSort === existingAlbum.name && existingAlbum.albumSort !== newAlbum.albumSort) {
        existingAlbum.albumStylized = newAlbum.albumSort;
        this.setChangesIfNotNew(existingAlbum);
      }
      return existingAlbum;
    }

    newAlbum.isNew = true;
    newAlbum.id = this.utilities.newGuid();
    newAlbum.favorite = false;
    newAlbum.primaryArtist = artist;
    newAlbum.primaryArtistId = artist.id;
    newAlbum.releaseDecade = this.utilities.getDecade(newAlbum.releaseYear);
    const albumType = this.first(metadata[MetaField.AlbumType]);
    newAlbum.albumTypeId = albumType ? this.getValueListEntryId(albumType, ValueLists.AlbumType.id, this.existingAlbumTypes) : ValueLists.AlbumType.entries.LP;
    newAlbum.hash = this.lookupService.hashAlbum(newAlbum.name, newAlbum.releaseYear);
    this.processImage(newAlbum.id, metadata, MetaField.AlbumImage);
    this.processImage(newAlbum.id, metadata, MetaField.AlbumSecondaryImage);

    this.existingAlbums.push(newAlbum);
    return newAlbum;
  }

  private processSong(album: AlbumEntity, metadata: KeyValues): SongEntity {
    const song = new SongEntity();
    song.id = this.utilities.newGuid();
    song.isNew = true;
    song.filePath = this.first(metadata[MetaField.FilePath]);
    song.hash = this.lookupService.hashSong(song.filePath);

    const ufId = this.first(metadata[MetaField.UfId]);
    if (ufId) {
      song.externalId = ufId;
    }

    song.name = this.first(metadata[MetaField.Title]);
    if (!song.name) {
      song.name = this.first(metadata[MetaField.FileName]);
    }

    song.primaryAlbum = album;
    song.primaryAlbumId = album.id;
    const trackNumber = this.first(metadata[MetaField.TrackNumber]);
    song.trackNumber = trackNumber ? trackNumber : 0;
    const mediaNumber = this.first(metadata[MetaField.MediaNumber]);
    song.mediaNumber = mediaNumber ? mediaNumber : 1;
    song.releaseYear = album.releaseYear;
    song.releaseDecade = album.releaseDecade;

    const composer = this.first(metadata[MetaField.Composer]);
    if (composer) {
      song.composer = composer;
    }
    const comment = this.first(metadata[MetaField.Comment]);
    if (comment) {
      song.comment = comment;
    }
    const grouping = this.first(metadata[MetaField.Grouping]);
    if (grouping) {
      song.grouping = grouping;
    }

    // Get dates
    let addDate = this.first(metadata[MetaField.AddDate]);
    if (!addDate) {
      addDate = new Date();
    }
    let changeDate = this.first(metadata[MetaField.ChangeDate]);
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

    // TODO: add language to value list entry if it doesn't exist
    song.language = this.first(metadata[MetaField.Language]);
    if (!song.language) {
      song.language = this.unknownValue;
    }

    song.mood = this.first(metadata[MetaField.Mood]);
    if (!song.mood) {
      song.mood = this.unknownValue;
    }

    // Rating
    song.rating = 0;
    const rating = this.first(metadata[MetaField.Rating]);
    if (rating) {
      song.rating = rating;
    }

    // Play Count
    song.playCount = 0;
    const playCount = this.first(metadata[MetaField.PlayCount]);
    if (playCount) {
      song.playCount = playCount;
    }
    // This will only be set once just for tracking purposes
    song.initialPlayCount = song.playCount;

    let lyrics = this.first(metadata[MetaField.UnSyncLyrics]);
    if (!lyrics) {
      lyrics = this.first(metadata[MetaField.SyncLyrics]);
    }
    if (lyrics) {
      song.lyrics = lyrics;
    }

    const titleSort = this.first(metadata[MetaField.TitleSort]);
    if (titleSort) {
      song.titleSort = titleSort;
    }
    else {
      song.titleSort = song.name;
    }

    song.live = false;
    const live = this.first(metadata[MetaField.Live]);
    if (live && live.toLowerCase() === 'true') {
      song.live = true;
    }

    song.seconds = this.first(metadata[MetaField.Seconds]);
    if (!song.seconds) {
      song.seconds = 0;
      this.log.warn('Duration not found for: ' + song.filePath);
    }
    song.duration = this.utilities.secondsToMinutes(song.seconds);
    song.bitrate = this.first(metadata[MetaField.Bitrate]);
    song.frequency = this.first(metadata[MetaField.Frequency]);
    song.vbr = this.first(metadata[MetaField.Vbr]);
    song.replayGain = this.first(metadata[MetaField.ReplayGain]);
    song.fileSize = this.first(metadata[MetaField.FileSize]);
    song.fullyParsed = this.first(metadata[MetaField.TagFullyParsed]);
    song.favorite = false;

    this.processImage(song.id, metadata, MetaField.SingleImage);
    return song;
  }

  private processImage(relatedId: string, metadata: KeyValues, field: MetaField): void {
    const image = this.first(metadata[field]) as IImageSource;

    if (image && image.sourcePath) {
      const existingImage = this.lookupService.findImage(image, this.existingImages);

      if (!existingImage) {
        const newImage = new RelatedImageEntity();
        newImage.id = this.utilities.newGuid();
        newImage.hash = this.lookupService.hashImage(image.sourcePath, image.sourceIndex);
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
      const title = this.first(metadata[MetaField.Title]);
      if (title) {
        return title;
      }
      const fileName = this.first(metadata[MetaField.FileName]);
      if (fileName) {
        return fileName;
      }
    }

    if (imageType === MusicImageType.Front || imageType === MusicImageType.FrontAlternate) {
      const album = this.first(metadata[MetaField.Album]);
      if (album) {
        return album;
      }
    }

    if (imageType === MusicImageType.Artist) {
      const albumArtist = this.first(metadata[MetaField.AlbumArtist]);
      if (albumArtist) {
        return albumArtist;
      }
    }

    return this.unknownValue;
  }

  private processArtists(metadata: KeyValues, splitSymbols: string[]): ArtistEntity[] {
    // This is the list of artists that will be eventually associated with a song
    const result: ArtistEntity[] = [];

    let artistNames: string[] = [];
    const otherArtists = metadata[MetaField.Artist];
    if (otherArtists && otherArtists.length) {
      artistNames = artistNames.concat(otherArtists);
    }
    const artistSorts = metadata[MetaField.ArtistSort];
    const featuringArtists = metadata[MetaField.FeaturingArtist];
    if (featuringArtists && featuringArtists.length) {
      artistNames = artistNames.concat(featuringArtists);
    }

    if (!artistNames.length) {
      return result;
    }

    let artistIndex = 0;
    for (const artistName of artistNames) {
      // Assuming sorts come in the same order as artists
      const artistSort = artistSorts && artistSorts.length > artistIndex ? artistSorts[artistIndex] : artistName;
      // Move to the next index since we are done using this one
      artistIndex++;
      const existingArtist = this.lookupService.findArtist(artistName, this.existingArtists);
      if (existingArtist) {
        if (existingArtist.artistSort === existingArtist.name && existingArtist.artistSort !== artistSort) {
          existingArtist.artistSort = artistSort;
          if (!existingArtist.isNew) {
            existingArtist.hasChanges = true;
          }
        }
        const existingResult = this.lookupService.findArtist(existingArtist.name, result);
        if (!existingResult) {
          result.push(existingArtist);
        }
      }
      else {
        const newArtist = this.createArtist(artistName, artistSort);
        // First, add the artist as it is
        this.existingArtists.push(newArtist);
        result.push(newArtist);

        // Second, perform split if specified
        if (splitSymbols && splitSymbols.length) {
          for (const splitSymbol of splitSymbols) {
            const splitArtistNames = artistName.split(splitSymbol);
            for (const splitArtistName of splitArtistNames) {
              const existingSplitArtist = this.lookupService.findArtist(splitArtistName, this.existingArtists);
              if (existingSplitArtist) {
                const existingResult = this.lookupService.findArtist(existingSplitArtist.name, result);
                if (!existingResult) {
                  result.push(existingSplitArtist);
                }
              }
              else {
                const newSplitArtist = this.createArtist(splitArtistName, splitArtistName);
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
    artist.id = this.utilities.newGuid();
    artist.isNew = true;
    artist.name = artistName;
    artist.artistStylized = artistName;
    artist.artistSort = artistSort;
    artist.favorite = false;
    artist.artistTypeId = ValueLists.ArtistType.entries.Unknown;
    artist.countryId = ValueLists.Country.entries.Unknown;
    artist.hash = this.lookupService.hashArtist(artistName);
    return artist;
  }

  private getValueListEntryId(entryName: string, valueListTypeId: string, entries: ValueListEntryEntity[]): string {
    const existingEntry = this.lookupService.findValueListEntry(entryName, null, entries);
    if (existingEntry) {
      return existingEntry.id;
    }
    const newEntry = new ValueListEntryEntity();
    newEntry.id = this.utilities.newGuid();
    newEntry.hash = this.lookupService.hashValueListEntry(entryName);
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
    const existingGenre = this.lookupService.findValueListEntry(name, null, this.existingGenres);
    if (existingGenre) {
      const existingResult = this.lookupService.findValueListEntry(existingGenre.name, null, genres);
      if (!existingResult) {
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
    genre.hash = this.lookupService.hashValueListEntry(genre.name);
    return genre;
  }

  /**
   * It will iterate each classification type declared in the database as so; each type will be
   * used to get classifications from the metadata as a dynamic field;
   * if you need a new classification type to be processed, add a new type to the db.
   * It creates the records for new classifications and returns the list of classifications
   * that need to be associated with the current song.
   */
  private processClassifications(metadata: KeyValues): ValueListEntryEntity[] {
    const result: ValueListEntryEntity[] = [];

    for (const classificationType of this.existingClassTypes) {
      const classData = this.first(metadata[classificationType.name]);
      if (classData) {
        let names = classData.split(',');
        names = this.utilities.removeDuplicates(names);
        for (const name of names) {
          const existingGlobalClass = this.lookupService.findValueListEntry(name, classificationType.id, this.existingClassifications);
          if (existingGlobalClass) {
            result.push(existingGlobalClass);
          }
          else {
            const newClassification = new ValueListEntryEntity();
            newClassification.id = this.utilities.newGuid();
            newClassification.isNew = true;
            newClassification.name = name;
            newClassification.valueListTypeId = classificationType.id;
            newClassification.isClassification = true;
            // TODO: determine how to specify the proper sequence
            newClassification.sequence = 0;
            newClassification.hash = this.lookupService.hashValueListEntry(newClassification.name);
            // Add it to cache to it is added as a new record
            this.existingClassifications.push(newClassification);
            // Add it as part of the result of this method
            result.push(newClassification);
          }
        }
      }
    }
    return result;
  }

  private processArtistRelations(metadata: KeyValues, primaryArtist: ArtistEntity, artists: ArtistEntity[]): void {
    // Primary artist
    const mainArtistRelation = new PartyRelationEntity();
    mainArtistRelation.id = this.utilities.newGuid();
    mainArtistRelation.relatedId = primaryArtist.id;
    mainArtistRelation.songId = this.songToProcess.id;
    mainArtistRelation.relationTypeId = PartyRelationType.Primary;
    this.existingPartyRelations.push(mainArtistRelation);

    // Featuring
    for (const artist of artists) {
      // Do not include the primary artist as featuring artist
      if (artist.name !== primaryArtist.name) {
        const partyRelation = new PartyRelationEntity();
        partyRelation.id = this.utilities.newGuid();
        partyRelation.relatedId = artist.id;
        partyRelation.songId = this.songToProcess.id;
        partyRelation.relationTypeId = PartyRelationType.Featuring;
        this.existingPartyRelations.push(partyRelation);
      }
    }

    // Singers
    const singers = metadata[MetaField.Singer];
    if (singers && singers.length) {
      for (const singer of singers) {
        let newRelatedId: string;
        const existingArtist = this.lookupService.findArtist(singer, this.existingArtists);
        if (existingArtist) {
          const existingRelation = this.lookupService.findSingerRelation(existingArtist.id, primaryArtist.id, this.existingPartyRelations);
          if (!existingRelation) {
            newRelatedId = existingArtist.id;
          }
        }
        else {
          const newArtist = this.createArtist(singer, singer);
          newRelatedId = newArtist.id;
          this.existingArtists.push(newArtist);
        }
        if (newRelatedId) {
          const singerRelation = new PartyRelationEntity();
          singerRelation.id = this.utilities.newGuid();
          singerRelation.relatedId = newRelatedId;
          singerRelation.artistId = primaryArtist.id;
          singerRelation.relationTypeId = PartyRelationType.Singer;
          this.existingPartyRelations.push(singerRelation);
        }
      }
    }

    // Contributors
    const contributors = metadata[MetaField.Contributor];
    if (contributors && contributors.length) {
      for (const contributor of contributors) {
        let newRelatedId: string;
        const existingArtist = this.lookupService.findArtist(contributor, this.existingArtists);
        if (existingArtist) {
          const existingRelation = this.lookupService.findContributorRelation(existingArtist.id, primaryArtist.id, this.existingPartyRelations);
          if (!existingRelation) {
            newRelatedId = existingArtist.id;
          }
        }
        else {
          const newArtist = this.createArtist(contributor, contributor);
          newRelatedId = newArtist.id;
          this.existingArtists.push(newArtist);
        }
        if (newRelatedId) {
          const contributorRelation = new PartyRelationEntity();
          contributorRelation.id = this.utilities.newGuid();
          contributorRelation.relatedId = newRelatedId;
          contributorRelation.artistId = primaryArtist.id;
          contributorRelation.relationTypeId = PartyRelationType.Contributor;
          this.existingPartyRelations.push(contributorRelation);
        }
      }
    }
  }

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

  /**
   * Removes unnecessary records from the database like song records associated with missing files.
  */
  private async cleanUpDatabase(syncInfo: ISyncInfo): Promise<void> {
    // 00. Start with images to delete
    // Do we really want to do this?
    const imageIdsToDelete: string[] = [];
    const skipImages = this.existingImages.filter(i => !i.isNew && i.sourceType === MusicImageSourceType.ImageFile);
    for (const image of skipImages) {
      if (!this.fileService.exists(image.sourcePath)) {
        imageIdsToDelete.push(image.id);
      }
    }

    if (imageIdsToDelete.length) {
      // Delete related images
      await RelatedImageEntity.delete({ id: In(imageIdsToDelete) });
    }

    // 01. Determine songs to be deleted (missing song files)
    syncInfo.songSkippedRecords = [];
    syncInfo.songDeletedRecords = [];
    const albumIdsToAnalyze: string[] = [];
    const noChangeSongs = this.existingSongs.filter(song => !song.isNew && !song.hasChanges);
    for (const song of noChangeSongs) {
      if (this.fileService.exists(song.filePath)) {
        syncInfo.songSkippedRecords.push(song);
      }
      else {
        syncInfo.songDeletedRecords.push(song);
        if (!albumIdsToAnalyze.includes(song.primaryAlbumId)) {
          albumIdsToAnalyze.push(song.primaryAlbumId);
        }
      }
    }
    if (!syncInfo.songDeletedRecords.length) {
      return;
    }
    const songIdsToDelete = syncInfo.songDeletedRecords.map(song => song.id);

    // DELETE ASSOCIATED SONG RECORDS
    // 02. Song classification
    await SongClassificationEntity.delete({ songId: In(songIdsToDelete) });
    // 03. PartyRelation
    await PartyRelationEntity.delete({ relatedId: In(songIdsToDelete)});
    await PartyRelationEntity.delete({ songId: In(songIdsToDelete)});
    // 04. Related image
    // In theory this will take care of images that match the file path of the song being deleted
    await RelatedImageEntity.delete({ relatedId: In(songIdsToDelete) });
    // 05. Playlist history
    await PlayHistoryEntity.delete({ songId: In(songIdsToDelete) });
    // 06. Playlist song
    await PlaylistSongEntity.delete({ songId: In(songIdsToDelete) });
    // 07. Songs
    await SongEntity.delete({ id: In(songIdsToDelete) });

    // 08. Determine albums to be deleted (with no songs)
    const albumCriteria = new Criteria();
    albumCriteria.searchCriteria.push(new CriteriaItem('songCount', 0));
    const albumIdCriteria = new CriteriaItem('id');
    for (const albumId of albumIdsToAnalyze) {
      albumIdCriteria.columnValues.push({ value: albumId});
    }
    const albumsToDelete = await this.db.getList(AlbumViewEntity, albumCriteria);
    if (!albumsToDelete.length) {
      return;
    }
    const albumIdsToDelete = albumsToDelete.map(album => album.id);
    const artistIdsToAnalyze = albumsToDelete
      .map(album => album.primaryArtistId)
      // Remove duplicates
      .reduce((previousValue, currentItem) => {
        if (!previousValue.includes(currentItem)) {
          previousValue.push(currentItem);
        }
        return previousValue;
      }, []);
    // DELETE ASSOCIATED ALBUM RECORDS
    // 09. PartyRelation
    await PartyRelationEntity.delete({ relatedId: In(albumIdsToDelete)});
    await PartyRelationEntity.delete({ albumId: In(albumIdsToDelete)});
    // 10. Related image
    await RelatedImageEntity.delete({ relatedId: In(albumIdsToDelete) });
    // 11. Albums
    await AlbumEntity.delete({ id: In(albumIdsToDelete) });
    // 12. Determine artists to be deleted (with no albums and no songs)
    const artistsWithNoSongs = await ArtistViewEntity.findBy({ id: In(artistIdsToAnalyze), songCount: 0 });
    if (!artistsWithNoSongs.length) {
      return;
    }
    // Now determine if these artists have no songs as composers
    const composerIdsToAnalyze = artistsWithNoSongs.map(artist => artist.id);
    const composersWithNoSongs = await ComposerViewEntity.findBy({ id: In(composerIdsToAnalyze), songCount: 0});
    if (!composersWithNoSongs.length) {
      return;
    }
    const artistIdsToDelete = composersWithNoSongs.map(composer => composer.id);
    // DELETE ASSOCIATED ARTIST RECORDS
    // 13. PartyRelation
    await PartyRelationEntity.delete({ relatedId: In(artistIdsToDelete)});
    await PartyRelationEntity.delete({ artistId: In(artistIdsToDelete)});
    // 14. Related image
    await RelatedImageEntity.delete({ relatedId: In(artistIdsToDelete) });
    // 15. Artists
    await ArtistEntity.delete({ id: In(artistIdsToDelete) });
  }

  private cleanUpMemory(): void {
    this.existingCountries = [];
    this.existingArtists = [];
    this.existingAlbums = [];
    this.existingGenres = [];
    this.existingClassifications = [];
    this.existingSongs = [];
    this.existingClassTypes = [];
    this.existingCountries = [];
    this.existingArtistTypes = [];
    this.existingAlbumTypes = [];
    this.existingImages = [];
    this.existingPartyRelations = [];
    this.existingSongClassifications = [];
  }

  private setChangesIfNotNew(entity: DbEntity): void {
    if (!entity.isNew) {
      entity.hasChanges = true;
    }
  }

  private first<T>(array: T[]): T {
    return this.utilities.first(array);
  }
}
