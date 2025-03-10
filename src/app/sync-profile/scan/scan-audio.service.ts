import { Injectable } from '@angular/core';
import {
  AlbumEntity,
  AlbumViewEntity,
  ArtistEntity,
  ArtistViewEntity,
  ComposerViewEntity,
  DbEntity,
  PartyRelationEntity,
  PlayHistoryEntity,
  PlaylistSongEntity,
  RelatedImageEntity,
  SongClassificationEntity,
  SongEntity,
  SongViewEntity,
  ValueListEntryEntity
} from '../../shared/entities';
import { FileService } from 'src/app/platform/file/file.service';
import { MetadataReaderService } from 'src/app/mapping/data-transform/metadata-reader.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { DatabaseService } from '../../shared/services/database/database.service';
import { DatabaseOptionsService } from '../../shared/services/database/database-options.service';
import { DatabaseLookupService } from '../../shared/services/database/database-lookup.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { ValueLists } from '../../shared/services/database/database.lists';
import { MetaAttribute } from 'src/app/mapping/data-transform/data-transform.enum';
import { ISyncSongInfo } from './scan.interface';
import { In, Not } from 'typeorm';
import { AlbumName, ArtistName, EntityId, ImageName, ModuleOptionId, SyncProfileId } from '../../shared/services/database/database.seed';
import { Criteria, CriteriaItem } from '../../shared/services/criteria/criteria.class';
import { MusicImageSourceType, MusicImageType } from 'src/app/platform/audio-metadata/audio-metadata.enum';
import { PartyRelationType } from '../../shared/models/music.enum';
import { IImageSource, KeyValues } from 'src/app/core/models/core.interface';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { DatabaseEntitiesService } from '../../shared/services/database/database-entities.service';

enum ScanFileMode {
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

/**
 * It offers actions to sync audio files.
 * This service is the middle point between the metadata reader and the database;
 * the metadata reader retrieves info from all its data sources into a single object;
 * this object is used by the service to store the info to the database.
 * Workflow: data sources > metadata reader > key values > scan service > database
 */
@Injectable({
  providedIn: 'root'
})
export class ScanAudioService {
  private scanMode: ScanFileMode;
  private songToProcess: SongEntity;
  /** List of classification types that will be processed. */
  private classTypeFields = [MetaAttribute.Subgenre, MetaAttribute.Category, MetaAttribute.Occasion, MetaAttribute.Instrument];
  // Options
  private ignoreNumericGenres = false;
  private genreSplitSymbols: string[] = [];
  private artistSplitSymbols: string[] = [];
  private minimumAudioDuration = 0;

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
    private utility: UtilityService,
    private db: DatabaseService,
    private entities: DatabaseEntitiesService,
    private options: DatabaseOptionsService,
    private lookupService: DatabaseLookupService,
    private log: LogService
  ) { }

  /** Initializes cache variables and the metadata reader. */
  public async beforeProcess(): Promise<ISyncSongInfo> {
    // Prepare global variables
    this.existingArtists = await ArtistEntity.find();
    this.existingAlbums = await AlbumEntity.find();
    this.existingClassTypes = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.ClassificationType.id });
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

    this.ignoreNumericGenres = this.options.getBoolean(ModuleOptionId.IgnoreNumericGenres);
    this.genreSplitSymbols = this.options.getArray(ModuleOptionId.GenreSplitCharacters);
    this.artistSplitSymbols = this.options.getArray(ModuleOptionId.ArtistSplitCharacters);
    this.minimumAudioDuration = this.options.getNumber(ModuleOptionId.MinimumAudioDuration);

    // Prepare reader, clarify that classification types will be handled as dynamic fields
    // TODO: how to exclude class types already handled: Genre, Language
    const syncProfile = await this.entities.getSyncProfile(SyncProfileId.DefaultAudioImport);
    const dataSources = await this.entities.getDataSources(syncProfile.id);
    await this.metadataReader.init(syncProfile, dataSources);

    const result: ISyncSongInfo = {
      songInitialCount: this.existingSongs.length,
      songFinalCount: 0,
      songAddedRecords: null,
      songUpdatedRecords: null,
      songSkippedRecords: null,
      songDeletedRecords: null,
      ignoredFiles: [],
      metadataResults: []
    };
    return result;
  }

  public async syncChangesToDatabase(syncInfo: ISyncSongInfo): Promise<void> {
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
      const artistUpdateColumns = ['artistType', 'artistSort', 'artistStylized', 'country'];
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
      const songUpdateColumns = ['lyrics', 'seconds', 'duration', 'bitrate', 'frequency', 'vbr', 'replayGain', 'fileSize', 'addDate', 'changeDate', 'replaceDate'];
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

  /**
   * Determines the scan file mode: Add, Update or Skip.
   */
  private async setMode(fileInfo: IFileInfo): Promise<void> {
    // TODO: if lyrics file or images files changed also set update mode
    this.songToProcess = this.lookupService.findSong(fileInfo.path, this.existingSongs);
    if (this.songToProcess) {
      if (this.options.getBoolean(ModuleOptionId.ForceFileSync)) {
        this.scanMode = ScanFileMode.Update;
      }
      else {
        const fileAddTime = fileInfo.addDate.getTime();
        const dbAddTime = this.songToProcess.addDate.getTime();
        if (fileAddTime === dbAddTime) {
          if (!this.songToProcess.lyrics && this.entities.hasLyricsFile(this.songToProcess)) {
            this.scanMode = ScanFileMode.Update;
          }
          else {
            this.scanMode = ScanFileMode.Skip;
          }
        }
        else {
          // If the add date changed, we are assuming the file was replaced or updated,
          // so we need to update the record with the new info
          this.scanMode = ScanFileMode.Update;
          
          if (fileAddTime < dbAddTime) {
            // This should only happen if something deliberately updated the dates
            // to an older value, so just log it as warning
            this.log.warn('Found file with older add date.', {
              filePath: fileInfo.path,
              fileAddDate: fileInfo.addDate,
              dbAddDate: this.songToProcess.addDate,
              fileChangeDate: fileInfo.changeDate,
              dbChangeDate: this.songToProcess.changeDate
            });
          }
        }
      }
    }
    else {
      this.scanMode = ScanFileMode.Add;
    }
  }

  public async processAudioFile(fileInfo: IFileInfo): Promise<KeyValues> {
    await this.setMode(fileInfo);

    if (this.scanMode === ScanFileMode.Skip) {
      return {
        [MetaAttribute.FileMode]: [this.scanMode],
        [MetaAttribute.Error]: []
      };
    }

    const metadata = await this.metadataReader.run(fileInfo);
    metadata[MetaAttribute.FileMode] = [this.scanMode];

    let errors = metadata[MetaAttribute.Error];
    if (!errors) {
      errors = metadata[MetaAttribute.Error] = [];
    }

    if (this.minimumAudioDuration) {
      const seconds = this.first(metadata[MetaAttribute.Seconds]);
      if (seconds && seconds < this.minimumAudioDuration) {
        metadata[MetaAttribute.Ignored] = [true];
        return metadata;
      }
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
    const artists = this.processArtists(metadata, this.artistSplitSymbols);

    // PRIMARY ALBUM
    const primaryAlbum = this.processAlbum(primaryArtist, metadata);

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

      // Special case for soundtracks
      if (this.songToProcess.genre === ValueLists.Genre.entries.Soundtrack.name &&
        primaryAlbum.albumType != ValueLists.AlbumType.entries.Soundtrack.name)
      {
        primaryAlbum.albumType = ValueLists.AlbumType.entries.Soundtrack.name;
      }
    }

    // Same for classifications
    // In this case valueListTypeId represents the classificationTypeId
    const classificationGroups = this.utility.groupByKey(classifications, 'valueListTypeId');
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
        songClassification.classificationTypeId = classification.valueListTypeId;
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
    let lyrics = this.first(metadata[MetaAttribute.UnSyncLyrics]);
    if (!lyrics) {
      lyrics = this.first(metadata[MetaAttribute.SyncLyrics]);
    }
    if (lyrics && lyrics !== this.songToProcess.lyrics) {
      this.songToProcess.lyrics = lyrics;
      this.songToProcess.hasChanges = true;
    }

    /** Was the song file replaced with a different one? */
    let replaced = false;
    // Use the following properties to determine if the file changed:
    // seconds, bitrate, frequency, replayGain, fileSize
    let seconds = this.first(metadata[MetaAttribute.Seconds]);
    if (seconds) {
      seconds = this.utility.round(seconds, 4);
      if (seconds !== this.songToProcess.seconds) {
        this.songToProcess.seconds = seconds;
        this.songToProcess.duration = this.utility.secondsToMinutes(seconds);
        replaced = true;
      }
    }
    let bitrate = this.first(metadata[MetaAttribute.Bitrate]);
    if (bitrate) {
      bitrate = this.utility.round(bitrate, 4);
      if (bitrate !== this.songToProcess.bitrate) {
        this.songToProcess.bitrate = bitrate;
        replaced = true;
      }
    }
    const frequency = this.first(metadata[MetaAttribute.Frequency]);
    if (frequency && frequency !== this.songToProcess.frequency) {
      this.songToProcess.frequency = frequency;
      replaced = true;
    }
    const vbr = metadata[MetaAttribute.Vbr];
    if (vbr?.length && vbr[0] !== this.songToProcess.vbr) {
      this.songToProcess.vbr = vbr[0];
      replaced = true;
    }
    const replayGain = this.first(metadata[MetaAttribute.ReplayGain]);
    if (replayGain && replayGain !== this.songToProcess.replayGain) {
      this.songToProcess.replayGain = replayGain;
      replaced = true;
    }
    const fileSize = this.first(metadata[MetaAttribute.FileSize]);
    if (fileSize && fileSize !== this.songToProcess.fileSize) {
      this.songToProcess.fileSize = fileSize;
      replaced = true;
    }

    let fileAddDate = this.first(metadata[MetaAttribute.AddDate]) as Date;
    if (!fileAddDate) {
      fileAddDate = new Date();
    }
    const fileAddTime = fileAddDate.getTime();
    const dbAddTime = this.songToProcess.addDate.getTime();

    // If the file add date is older, use the file date
    if (dbAddTime > fileAddTime) {
      this.songToProcess.addDate = fileAddDate;
      this.songToProcess.hasChanges = true;
    }
    // If the db date is older than the file date, update the file
    else if (dbAddTime < fileAddTime) {
      // TODO: If the sync db function fails this change will prevent the sync process
      // to find this file again. This change should happen after the db is updated
      await this.setFileAddDate(this.songToProcess.filePath, this.songToProcess.addDate);
      this.log.debug('Setting older creation date for file: ' + this.songToProcess.filePath, {
        dbAddDate: this.songToProcess.addDate,
        fileAddDate: fileAddDate
      });
    }

    if (replaced) {
      this.songToProcess.replaceDate = new Date();
      // If the file was replaced turn on the flag to save the new data,
      // and also to update the changeDate
      this.songToProcess.hasChanges = true;
    }

    if (this.songToProcess.hasChanges) {
      this.songToProcess.changeDate = new Date();
    }

    // Images
    const existingAlbum = this.existingAlbums.find(a => a.id === this.songToProcess.primaryAlbumId);
    this.processImage(existingAlbum.primaryArtistId, metadata, MetaAttribute.ArtistImage);
    this.processImage(this.songToProcess.primaryAlbumId, metadata, MetaAttribute.AlbumImage);
    this.processImage(this.songToProcess.primaryAlbumId, metadata, MetaAttribute.AlbumSecondaryImage);
    this.processImage(this.songToProcess.primaryAlbumId, metadata, MetaAttribute.AlbumAnimated);
    this.processImage(this.songToProcess.id, metadata, MetaAttribute.SingleImage);
    return metadata;
  }

  private processAlbumArtist(metadata: KeyValues): ArtistEntity {
    let artistName = this.first(metadata[MetaAttribute.AlbumArtist]);
    if (!artistName) {
      artistName = this.first(metadata[MetaAttribute.Artist]);
      if (!artistName) {
        artistName = ArtistName.Unknown
      }
    }

    const artistType = this.first(metadata[MetaAttribute.ArtistType]);
    const country = this.first(metadata[MetaAttribute.Country]);
    const artistStylized = this.first(metadata[MetaAttribute.AlbumArtistStylized]);
    const artistSort = this.first(metadata[MetaAttribute.AlbumArtistSort]);

    const newArtist = this.createArtist(artistName, artistSort, artistStylized);
    newArtist.artistType = artistType ? this.registerValueListEntry(artistType, ValueLists.ArtistType.id, this.existingArtistTypes) : ValueLists.ArtistType.entries.Unknown.name;
    newArtist.country = country ? this.registerValueListEntry(country, ValueLists.Country.id, this.existingCountries) : ValueLists.Country.entries.Unknown.name;

    const existingArtist = this.lookupService.findArtist(newArtist.name, this.existingArtists);
    if (existingArtist) {
      if (existingArtist.artistType === ValueLists.ArtistType.entries.Unknown.name && existingArtist.artistType !== newArtist.artistType) {
        existingArtist.artistType = newArtist.artistType;
        this.setChangesIfNotNew(existingArtist);
      }
      if (existingArtist.country === ValueLists.Country.entries.Unknown.name && existingArtist.country !== newArtist.country) {
        existingArtist.country = newArtist.country;
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

    this.processImage(newArtist.id, metadata, MetaAttribute.AlbumArtistImage);
    this.existingArtists.push(newArtist);
    return newArtist;
  }

  private processAlbum(artist: ArtistEntity, metadata: KeyValues): AlbumEntity {
    const newAlbum = new AlbumEntity();
    this.setFirst(newAlbum, 'name', metadata, MetaAttribute.Album, AlbumName.Unknown);
    // Is this actually the album year? Album year and song year might be different.
    this.setFirst(newAlbum, 'releaseYear', metadata, MetaAttribute.Year, 0);
    this.setFirst(newAlbum, 'albumSort', metadata, MetaAttribute.AlbumSort, newAlbum.name);
    this.setFirst(newAlbum, 'publisher', metadata, MetaAttribute.Publisher);

    let albumCleanName = '';
    const brackets = this.utility.matchBrackets(newAlbum.name);
    if (brackets?.length) {
      for (const bracket of brackets) {
        albumCleanName = newAlbum.name.replace(bracket, '').trim();
      }
    }
    else {
      albumCleanName = newAlbum.name;
    }
    this.setFirst(newAlbum, 'albumStylized', metadata, MetaAttribute.AlbumStylized, albumCleanName);

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
        existingAlbum.albumSort = newAlbum.albumSort;
        this.setChangesIfNotNew(existingAlbum);
      }
      return existingAlbum;
    }

    newAlbum.isNew = true;
    newAlbum.id = this.utility.newGuid();
    newAlbum.favorite = false;
    newAlbum.primaryArtistId = artist.id;
    newAlbum.releaseDecade = this.utility.getDecade(newAlbum.releaseYear);
    const albumType = this.first(metadata[MetaAttribute.AlbumType]);
    newAlbum.albumType = albumType ? this.registerValueListEntry(albumType, ValueLists.AlbumType.id, this.existingAlbumTypes) : ValueLists.AlbumType.entries.Album.name;
    newAlbum.hash = this.lookupService.hashAlbum(newAlbum.name, newAlbum.releaseYear);
    this.processImage(newAlbum.id, metadata, MetaAttribute.AlbumImage);
    this.processImage(newAlbum.id, metadata, MetaAttribute.AlbumSecondaryImage);
    this.processImage(newAlbum.id, metadata, MetaAttribute.AlbumAnimated);

    this.existingAlbums.push(newAlbum);
    return newAlbum;
  }

  private processSong(album: AlbumEntity, metadata: KeyValues): SongEntity {
    const song = new SongEntity();
    song.id = this.utility.newGuid();
    song.isNew = true;
    song.filePath = this.first(metadata[MetaAttribute.FilePath]);
    song.fileExtension = this.first(metadata[MetaAttribute.FileExtension]);
    song.hash = this.lookupService.hashSong(song.filePath);

    this.setFirst(song, 'externalId', metadata, MetaAttribute.UfId);
    this.setFirst(song, 'name', metadata, MetaAttribute.Title, this.first(metadata[MetaAttribute.FileName]));

    // Clean file name from brackets
    // TODO: use a module option to perform this action
    const brackets = this.utility.matchBrackets(song.name);
    if (brackets?.length) {
      for (const bracket of brackets) {
        song.cleanName = song.name.replace(bracket, '').trim();
      }
    }
    else {
      song.cleanName = song.name;
    }

    song.subtitle = this.first(metadata[MetaAttribute.Subtitle]);
    if (!song.subtitle) {
      const parenthesis = this.utility.matchParenthesis(song.name);
      if (parenthesis?.length) {
        song.subtitle = parenthesis.map(v => v.replace('(', '').replace(')', '')).join(', ');
      }
    }

    const featuringArtists = metadata[MetaAttribute.FeaturingArtist];
    if (featuringArtists?.length) {
      song.featuring = featuringArtists.join(', ');
    }
    else if (brackets?.length) {
      song.featuring = brackets.map(v => v.replace('[', '').replace(']', '')).join(', ');
    }

    song.primaryAlbumId = album.id;

    this.setFirst(song, 'trackNumber', metadata, MetaAttribute.TrackNumber, 0);
    this.setFirst(song, 'mediaNumber', metadata, MetaAttribute.MediaNumber, 1);
    this.setFirst(song, 'mediaSubtitle', metadata, MetaAttribute.MediaSubtitle);
    if (!song.mediaSubtitle) {
      const mediaSubtitles = metadata[MetaAttribute.MediaSubtitles];
      // Validate the media number has a subtitle
      if (mediaSubtitles?.length >= song.mediaNumber) {
        song.mediaSubtitle = mediaSubtitles[song.mediaNumber - 1];
      }
    }
    song.releaseYear = album.releaseYear;
    song.releaseDecade = album.releaseDecade;

    this.setFirst(song, 'composer', metadata, MetaAttribute.Composer);
    this.setFirst(song, 'composerSort', metadata, MetaAttribute.ComposerSort);
    this.setFirst(song, 'originalArtist', metadata, MetaAttribute.OriginalArtist);
    this.setFirst(song, 'originalAlbum', metadata, MetaAttribute.OriginalAlbum);
    this.setFirst(song, 'originalReleaseYear', metadata, MetaAttribute.OriginalReleaseYear, 0);
    this.setFirst(song, 'comment', metadata, MetaAttribute.Comment);
    this.setFirst(song, 'grouping', metadata, MetaAttribute.Grouping);

    // Add Date
    let addDate = this.first(metadata[MetaAttribute.AddDate]) as Date;
    if (!addDate) {
      addDate = new Date();
    }
    // We only use the change date to see which one is older
    let changeDate = this.first(metadata[MetaAttribute.ChangeDate]) as Date;
    if (changeDate) {
      const addTime = addDate.getTime();
      const changeTime = changeDate.getTime();
      if (addTime > changeTime) {
        // Grab the oldest date as the add date
        addDate = changeDate;
      }
    }
    
    // Set dates in db
    song.addDate = addDate;
    song.addYear = addDate.getFullYear();
    // We are doing the change now
    song.changeDate = new Date();
    // TODO: Set dates in file

    // TODO: add language/mood to value list entry if it doesn't exist
    this.setFirst(song, 'language', metadata, MetaAttribute.Language, ValueLists.Language.entries.Unknown.name);
    this.setFirst(song, 'mood', metadata, MetaAttribute.Mood, ValueLists.Mood.entries.Unknown.name);

    this.setFirst(song, 'rating', metadata, MetaAttribute.Rating, 0);
    this.setFirst(song, 'playCount', metadata, MetaAttribute.PlayCount, 0);

    let lyrics = this.first(metadata[MetaAttribute.UnSyncLyrics]);
    if (!lyrics) {
      lyrics = this.first(metadata[MetaAttribute.SyncLyrics]);
    }
    if (lyrics) {
      song.lyrics = lyrics;
    }

    this.setFirst(song, 'titleSort', metadata, MetaAttribute.TitleSort, song.name);
    this.setFirst(song, 'live', metadata, MetaAttribute.Live, false);
    this.setFirst(song, 'favorite', metadata, MetaAttribute.Favorite, false);
    this.setFirst(song, 'advisory', metadata, MetaAttribute.Advisory, 0);

    // Let's start with zero but this cannot be the final value, it should be at least 1
    // If this value is not found here, the processArtistRelations will figure it out
    this.setFirst(song, 'performerCount', metadata, MetaAttribute.PerformerCount, 0);

    let bitrate = this.first(metadata[MetaAttribute.Bitrate]);
    song.bitrate = bitrate ? this.utility.round(bitrate, 4) : 0;

    this.setFirst(song, 'frequency', metadata, MetaAttribute.Frequency, 0);
    this.setFirst(song, 'tempo', metadata, MetaAttribute.Tempo, 0);
    this.setFirst(song, 'replayGain', metadata, MetaAttribute.ReplayGain, 0);

    let seconds = this.first(metadata[MetaAttribute.Seconds]);
    song.seconds = seconds ? this.utility.round(seconds, 4) : 0;
    song.duration = this.utility.secondsToMinutes(song.seconds);
    song.vbr = this.first(metadata[MetaAttribute.Vbr]);
    song.fileSize = this.first(metadata[MetaAttribute.FileSize]);
    song.infoUrl = this.first(metadata[MetaAttribute.Url]);
    song.videoUrl = this.first(metadata[MetaAttribute.VideoUrl]);

    this.processImage(song.id, metadata, MetaAttribute.SingleImage);
    return song;
  }

  private processImage(relatedId: string, metadata: KeyValues, field: MetaAttribute): void {
    const image = this.first(metadata[field]) as IImageSource;

    if (image && image.sourcePath) {
      const existingImage = this.lookupService.findImage(image, this.existingImages);

      if (!existingImage) {
        const newImage = new RelatedImageEntity();
        newImage.id = this.utility.newGuid();
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
      const title = this.first(metadata[MetaAttribute.Title]);
      if (title) {
        return title;
      }
      const fileName = this.first(metadata[MetaAttribute.FileName]);
      if (fileName) {
        return fileName;
      }
    }

    if (imageType === MusicImageType.Front || imageType === MusicImageType.FrontAlternate || imageType === MusicImageType.FrontAnimated) {
      const album = this.first(metadata[MetaAttribute.Album]);
      if (album) {
        return album;
      }
    }

    if (imageType === MusicImageType.AlbumArtist) {
      const albumArtist = this.first(metadata[MetaAttribute.AlbumArtist]);
      if (albumArtist) {
        return albumArtist;
      }
    }

    if (imageType === MusicImageType.Artist) {
      const artist = this.first(metadata[MetaAttribute.Artist]);
      if (artist) {
        return artist;
      }
    }

    return ImageName.Unknown;
  }

  private processArtists(metadata: KeyValues, splitSymbols: string[]): ArtistEntity[] {
    // This is the list of artists that will be eventually associated with a song
    const result: ArtistEntity[] = [];

    let artistNames: string[] = [];
    const otherArtists = metadata[MetaAttribute.Artist];
    if (otherArtists && otherArtists.length) {
      artistNames = artistNames.concat(otherArtists);
    }
    const artistSorts = metadata[MetaAttribute.ArtistSort];
    const featuringArtists = metadata[MetaAttribute.FeaturingArtist];
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
          this.setChangesIfNotNew(existingArtist);
        }
        const existingResult = this.lookupService.findArtist(existingArtist.name, result);
        if (!existingResult) {
          result.push(existingArtist);
        }
      }
      else {
        //const newArtist = this.createArtist(artistName, artistSort);
        // First, add the artist as it is
        //this.existingArtists.push(newArtist);
        //result.push(newArtist);

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

  private createAlbum(primaryArtistId: string, albumName: string, releaseYear: number): AlbumEntity {
    const album = new AlbumEntity();
    album.id = this.utility.newGuid();
    album.isNew = true;
    album.name = albumName;
    album.albumSort = albumName;
    album.albumStylized = albumName;
    album.primaryArtistId = primaryArtistId;
    album.releaseYear = releaseYear;
    album.releaseDecade = this.utility.getDecade(album.releaseYear);
    album.hash = this.lookupService.hashAlbum(album.name, album.releaseYear);
    album.favorite = false;
    album.albumType = ValueLists.AlbumType.entries.Album.name;
    return album;
  }

  private createArtist(artistName: string, artistSort?: string, artistStylized?: string): ArtistEntity {
    const artist = new ArtistEntity();
    artist.id = this.utility.newGuid();
    artist.isNew = true;
    artist.name = artistName;
    artist.artistStylized = artistStylized ? artistStylized : artistName;
    artist.artistSort = artistSort ? artistSort : artistName;
    artist.favorite = false;
    // Most of the artists are vocal
    artist.vocal = true;
    artist.artistType = ValueLists.ArtistType.entries.Unknown.name;
    artist.artistGender = ValueLists.Gender.entries.Unknown.name;
    artist.country = ValueLists.Country.entries.Unknown.name;
    artist.hash = this.lookupService.hashArtist(artistName);
    return artist;
  }

  private registerValueListEntry(entryName: string, valueListTypeId: string, entries: ValueListEntryEntity[]): string {
    const existingEntry = this.lookupService.findValueListEntry(entryName, null, entries);
    if (existingEntry) {
      return existingEntry.name;
    }
    const newEntry = new ValueListEntryEntity();
    newEntry.id = this.utility.newGuid();
    newEntry.hash = this.lookupService.hashValueListEntry(entryName);
    newEntry.valueListTypeId = valueListTypeId;
    newEntry.name = entryName;
    // TODO: specify proper sequence
    newEntry.sequence = 0;
    newEntry.isClassification = false;
    newEntry.isNew = true;
    entries.push(newEntry);
    return newEntry.name;
  }

  private processGenres(metadata: KeyValues, splitSymbols: string[]): ValueListEntryEntity[] {
    const result: ValueListEntryEntity[] = [];
    const genres = metadata[MetaAttribute.Genre];
    if (genres?.length) {
      for (const genreName of genres) {
        if (!genreName) {
          // It is possible to have an item with no value so ignore it
          continue;
        }
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
        else {
          // If no symbols add the genre as it is
          this.processGenre(genreName, genres);
        }
      }
    }
    return result;
  }

  private processGenre(name: string, genres: ValueListEntryEntity[]): void {
    if (this.ignoreNumericGenres && this.utility.isNumber(name)) {
      return;
    }
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
    genre.id = this.utility.newGuid();
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

    for (const classTypeField of this.classTypeFields) {
      // Fields should be camel case;
      // Class types should be pascal case (no spaces);
      // so let's compare both with lower case
      const classificationType = this.existingClassTypes.find(t => t.name.toLowerCase() === classTypeField.toLowerCase());
      if (!classificationType) {
        continue;
      }
      const classData = this.first(metadata[classTypeField]);
      if (classData) {
        let names = classData.split(',');
        names = this.utility.removeDuplicates(names);
        for (const name of names) {
          const existingGlobalClass = this.lookupService.findValueListEntry(name, classificationType.id, this.existingClassifications);
          if (existingGlobalClass) {
            result.push(existingGlobalClass);
          }
          else {
            const newClassification = new ValueListEntryEntity();
            newClassification.id = this.utility.newGuid();
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
    mainArtistRelation.id = this.utility.newGuid();
    mainArtistRelation.relatedId = primaryArtist.id;
    mainArtistRelation.songId = this.songToProcess.id;
    mainArtistRelation.relationTypeId = PartyRelationType.Primary;
    this.existingPartyRelations.push(mainArtistRelation);

    // Featuring
    let featuringCount = 0;
    for (const artist of artists) {
      // Do not include the primary artist as featuring artist
      if (artist.name !== primaryArtist.name) {
        const partyRelation = new PartyRelationEntity();
        partyRelation.id = this.utility.newGuid();
        partyRelation.relatedId = artist.id;
        partyRelation.songId = this.songToProcess.id;
        partyRelation.relationTypeId = PartyRelationType.Featuring;
        this.existingPartyRelations.push(partyRelation);
        featuringCount++;
      }
    }
    if (!this.songToProcess.performerCount) {
      if (featuringCount) {
        this.songToProcess.performerCount = featuringCount;
        // Also take the primary artist in consideration, except for Various which is not an actual artist
        if (primaryArtist.id !== EntityId.ArtistVarious) {
          this.songToProcess.performerCount++;
        }
      }
      else {
        // Default
        this.songToProcess.performerCount = 1;
      }
    }

    // Singers
    const singers = metadata[MetaAttribute.Singer];
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
          singerRelation.id = this.utility.newGuid();
          singerRelation.relatedId = newRelatedId;
          singerRelation.artistId = primaryArtist.id;
          singerRelation.relationTypeId = PartyRelationType.Singer;
          this.existingPartyRelations.push(singerRelation);
        }
      }
    }

    // Contributors
    const contributors = metadata[MetaAttribute.Contributor];
    if (contributors?.length) {
      for (const contributor of contributors) {
        let contributorId: string;
        const existingArtist = this.lookupService.findArtist(contributor, this.existingArtists);
        if (existingArtist) {
          const existingRelation = this.lookupService.findContributorRelation(existingArtist.id, primaryArtist.id, this.existingPartyRelations);
          if (!existingRelation) {
            contributorId = existingArtist.id;
          }
        }
        else {
          const newArtist = this.createArtist(contributor, contributor);
          contributorId = newArtist.id;
          this.existingArtists.push(newArtist);
        }
        if (contributorId) {
          const contributorRelation = new PartyRelationEntity();
          contributorRelation.id = this.utility.newGuid();
          contributorRelation.relatedId = contributorId;
          contributorRelation.artistId = primaryArtist.id;
          contributorRelation.relationTypeId = PartyRelationType.Contributor;
          this.existingPartyRelations.push(contributorRelation);
        }
      }
    }
  }

  /**
   * Removes unnecessary records from the database like song records associated with missing files.
  */
  public async cleanUpDatabase(syncInfo: ISyncSongInfo): Promise<void> {
    // IMAGES
    // 00. Start with images to delete
    // We need this routine for deleting records from images that were deleted manually in disk
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

    // SONGS
    // 01. Determine songs to be deleted (missing song files)
    // TODO: this logic does not detect song records that are no longer part of the scan directories
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

    // ALBUMS
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
    // DELETE ASSOCIATED ALBUM RECORDS
    // 09. PartyRelation
    await PartyRelationEntity.delete({ relatedId: In(albumIdsToDelete)});
    await PartyRelationEntity.delete({ albumId: In(albumIdsToDelete)});
    // 10. Related image
    await RelatedImageEntity.delete({ relatedId: In(albumIdsToDelete) });
    // 11. Albums
    await AlbumEntity.delete({ id: In(albumIdsToDelete) });

    // ARTISTS
    // 12. Determine artists to be deleted (with no albums and no songs)
    // TODO: this logic only considers primary artists associated to deleted albums,
    // but not considering featuring artists associated with deleted songs
    const artistIdsToAnalyze = albumsToDelete
      .map(album => album.primaryArtistId)
      // Remove duplicates
      .reduce((previousValue, currentItem) => {
        if (!previousValue.includes(currentItem)) {
          previousValue.push(currentItem);
        }
        return previousValue;
      }, [] as string[]);
    // Ignore Various from the delete process
    let indexToRemove = artistIdsToAnalyze.indexOf(EntityId.ArtistVarious);
    while (indexToRemove >= 0) {
      artistIdsToAnalyze.splice(indexToRemove, 1);
      indexToRemove = artistIdsToAnalyze.indexOf(EntityId.ArtistVarious);
    }

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

  public cleanUpMemory(): void {
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

  public async moveSong(songId: string, newDirectoryPath: string, newFileName: string): Promise<void> {
    const existingSong = await SongEntity.findOneBy({ id: songId });
    const newFilePath = this.fileService.combine(newDirectoryPath, newFileName);
    if (this.fileService.exists(newFilePath)) {
      return;
    }

    
    // Move file
    await this.fileService.copyFile(existingSong.filePath, newFilePath);
    // Get metadata using the new location
    const newFileInfo = await this.fileService.getFileInfo(newFilePath);
    const newMetadata = await this.metadataReader.run(newFileInfo);
    // TODO: move (copy and then delete old ones) lyrics file and single image?

    // Things that can change when the file path changes:
    // Language (DONE)
    // Genre (DONE)
    // Artist Name (DONE)
    // Artist Stylized
    // Year/Decade (DONE)
    // Featuring (DONE)
    // Album Name (DONE)
    // Contributors/Party Relation/Performer Count
    // Artist Image
    // Album Image
    // Single Image

    // ARTIST

    /** Starts as the original album but it may change to a different existing album or a new one. */
    let primaryAlbum = await AlbumEntity.findOneBy({ id: existingSong.primaryAlbumId });
    /** Starts as the original artist but it may change to a different existing artist or a new one. */
    let primaryArtist = await ArtistEntity.findOneBy({ id: primaryAlbum.primaryArtistId });

    const newArtistName = this.first(newMetadata[MetaAttribute.AlbumArtist]);
    const newAlbumName = this.first(newMetadata[MetaAttribute.Album]);
    const newYear = this.first(newMetadata[MetaAttribute.Year]);
    const newReleaseYear = newYear ? newYear : 0;

    // If the artist is different create or update the artist
    if (primaryArtist.name !== newArtistName) {
      const artistSongCount = await SongViewEntity.findBy({ primaryArtistId: primaryArtist.id });
      // Rename the existing artist since there's only one song
      if (artistSongCount.length === 1) {
        primaryArtist.name = newArtistName;
        primaryArtist.artistSort = newArtistName;
        primaryArtist.artistStylized = newArtistName;
        primaryArtist.hash = this.lookupService.hashArtist(primaryArtist.name);
        await primaryArtist.save();
      }
      // This means only this song is being moved to a different artist
      else if (artistSongCount.length > 1) {
        // Does the artist exist?
        primaryArtist = await this.lookupService.lookupArtist(newArtistName);
        // If not, create a new one
        if (!primaryArtist) {
          // PARTY RELATION: PRIMARY
          // Before creating artist, get the party relation
          const primaryArtistRelation = await PartyRelationEntity.findOneBy({ relatedId: primaryAlbum.id, songId: songId, relationTypeId: PartyRelationType.Primary });
          primaryArtist = this.createArtist(newArtistName, newArtistName, newArtistName);
          // Save new artist id
          primaryArtistRelation.relatedId = primaryArtist.id;
          await primaryArtistRelation.save();
        }
        await primaryArtist.save();
      }
    }

    // FEATURING ARTISTS
    // const featuringRelations = await PartyRelationEntity.findBy({ songId: songId, relationTypeId: PartyRelationType.Featuring });
    // This is for now disabled assuming that we are just moving a file but not changing its name (which would affect the featuring artists)
    // Eventually we should support this
    // Performer count is also calculated here

    // SINGERS
    // CONTRIBUTORS

    // ALBUM
    let needsNewAlbum = false;
    if (primaryArtist.id === primaryAlbum.primaryArtistId) {
      // Same artist, but album name or year different?
      if (primaryAlbum.name !== newAlbumName || primaryAlbum.releaseYear !== newReleaseYear) {
        const songs = await SongViewEntity.findBy({ primaryAlbumId: primaryAlbum.id });
        // If same artist, but different album name/year and the album has multiple songs, we need a new album
        needsNewAlbum = songs.length > 1;
      }
    }
    // If the artist changed, a new album is needed
    else {
      needsNewAlbum = true;
    }

    if (needsNewAlbum) {
      primaryAlbum = this.createAlbum(primaryArtist.id, newAlbumName, newReleaseYear);
    }
    // Update album data if a new one was not created
    else {
      primaryAlbum.name = newAlbumName;
      primaryAlbum.albumSort = newAlbumName;
      primaryAlbum.albumStylized = newAlbumName;
      primaryAlbum.releaseYear = newReleaseYear;
      primaryAlbum.releaseDecade = this.utility.getDecade(primaryAlbum.releaseYear);
      primaryAlbum.hash = this.lookupService.hashAlbum(primaryAlbum.name, primaryAlbum.releaseYear);
    }
    await primaryAlbum.save();
    existingSong.primaryAlbumId = primaryAlbum.id;
    existingSong.releaseYear = primaryAlbum.releaseYear;
    existingSong.releaseDecade = primaryAlbum.releaseDecade;

    // GENRE
    const genre = this.first(newMetadata[MetaAttribute.Genre]);
    if (genre && existingSong.genre !== genre) {
      // Remove classification
      const currentGenreEntry = await ValueListEntryEntity.findOneBy({ name: existingSong.genre, valueListTypeId: ValueLists.Genre.id });
      if (currentGenreEntry) {
        await SongClassificationEntity.delete({ songId: songId, classificationId: currentGenreEntry.id });
      }
      // Replace current with new one
      existingSong.genre = genre;
      // Add new classification
      let newGenreEntry = await ValueListEntryEntity.findOneBy({ name: existingSong.genre, valueListTypeId: ValueLists.Genre.id });
      if (!newGenreEntry) {
        newGenreEntry = new ValueListEntryEntity();
        newGenreEntry.id = this.utility.newGuid();
        newGenreEntry.name = existingSong.genre;
        newGenreEntry.hash = this.lookupService.hashValueListEntry(newGenreEntry.name);
        newGenreEntry.valueListTypeId = ValueLists.Genre.id;
        newGenreEntry.isClassification = true;
        newGenreEntry.sequence = 0;
        await newGenreEntry.save();
      }
      let songClass = await SongClassificationEntity.findOneBy({ songId: songId, classificationId: newGenreEntry.id });
      if (!songClass) {
        songClass = new SongClassificationEntity();
        songClass.songId = songId;
        songClass.classificationId = newGenreEntry.id;
        songClass.classificationTypeId = ValueLists.Genre.id;
        songClass.primary = false;
      }
    }

    // SONG
    existingSong.filePath = newFilePath;
    existingSong.hash = this.lookupService.hashSong(existingSong.filePath);
    this.setFirst(existingSong, 'name', newMetadata, MetaAttribute.Title, this.first(newMetadata[MetaAttribute.FileName]));

    const brackets = this.utility.matchBrackets(existingSong.name);
    if (brackets?.length) {
      for (const bracket of brackets) {
        existingSong.cleanName = existingSong.name.replace(bracket, '').trim();
      }
    }
    else {
      existingSong.cleanName = existingSong.name;
    }

    const featuringArtists = newMetadata[MetaAttribute.FeaturingArtist];
    if (featuringArtists?.length) {
      existingSong.featuring = featuringArtists.join(', ');
    }
    else if (brackets?.length) {
      existingSong.featuring = brackets.map(v => v.replace('[', '').replace(']', '')).join(', ');
    }

    this.setFirst(existingSong, 'trackNumber', newMetadata, MetaAttribute.TrackNumber, 0);
    this.setFirst(existingSong, 'mediaNumber', newMetadata, MetaAttribute.MediaNumber, 1);
    this.setFirst(existingSong, 'titleSort', newMetadata, MetaAttribute.TitleSort, existingSong.name);
    this.setFirst(existingSong, 'language', newMetadata, MetaAttribute.Language);
    existingSong.performerCount = 0;

    // UPDATE NEW FILE DATES
    await this.setFileAddDate(existingSong.filePath, existingSong.addDate);
    // change date also needed?

    // RELATED IMAGES

    // ALSO MOVE ASSOCIATED FILES (json, txt, jpg)
    // DELETE FILE
  }

  private setChangesIfNotNew(entity: DbEntity): void {
    if (!entity.isNew) {
      entity.hasChanges = true;
    }
  }

  private first<T>(array: T[]): T {
    return this.utility.first(array);
  }

  /**
   * Sets a new date in the creation date attribute of the file.
   * It uses a cmd file that calls a .net library.
   */
  private async setFileAddDate(filePath: string, addDate: Date): Promise<void> {
    // This is a hack that uses a .net cmd file to update the creation date,
    // since node doesn't support this.
    const utilityFilePath = 'F:\\Code\\VS Online\\SoloSoft\\Bin46\\FileAttributeCmd.exe';
    if (!this.fileService.exists(utilityFilePath)) {
      return;
    }
    // This will put the string between quotes (needed for the command) and also escape backslashes (needed for the command)
    let command = JSON.stringify(filePath);
    command += ' setAddDate ' + this.utility.toTicks(addDate, true);
    const result = await this.fileService.runCommand(`"${utilityFilePath}" ${command}`);
    this.log.info(result);
  }

  private setFirst(obj: any, propertyName: string, metadata: KeyValues, field: MetaAttribute, defaultValue?: any): void {
    const value = this.first(metadata[field]);
    if (value) {
      obj[propertyName] = value;
    }
    else if (defaultValue !== undefined) {
      obj[propertyName] = defaultValue;
    }
  }
}
