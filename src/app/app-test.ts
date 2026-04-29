import { Injectable } from "@angular/core";
import { ExportService } from "./sync-profile/export/export.service";
import { DialogService } from "./platform/dialog/dialog.service";
import { FileService } from "./platform/file/file.service";
import { AudioMetadataService } from "./platform/audio-metadata/audio-metadata.service";
import { LogService } from "./core/services/log/log.service";
import { DatabaseService } from "./shared/services/database/database.service";
import { DatabaseEntitiesService } from "./shared/services/database/database-entities.service";
import { DatabaseOptionsService } from "./shared/services/database/database-options.service";
import { AlbumViewEntity, ArtistEntity, FilterCriteriaEntity, FilterCriteriaItemEntity, FilterEntity, PlayHistoryEntity, PlaylistEntity, PlaylistSongEntity, RelatedImageEntity, SongClassificationEntity, SongEntity, SongExtendedByPlaylistViewEntity, SongExtendedViewEntity, SongViewEntity, ValueListEntryEntity } from "./shared/entities";
import { UtilityService } from "./core/services/utility/utility.service";
import { ISize, IValuePair } from "./core/models/core.interface";
import { ValueLists } from "./shared/services/database/database.lists";
import { DatabaseLookupService } from "./shared/services/database/database-lookup.service";
import { In, IsNull, Like, MoreThan, Not } from "typeorm";
import { Criteria, CriteriaItem } from "./shared/services/criteria/criteria.class";
import { CriteriaComparison } from "./shared/services/criteria/criteria.enum";
import { RelativeDateUnit } from "./shared/services/relative-date/relative-date.enum";
import { HttpClient } from "@angular/common/http";
import { LocalStorageService } from "./core/services/local-storage/local-storage.service";
import { MusicImageSourceType, MusicImageType } from "./platform/audio-metadata/audio-metadata.enum";
import { RelatedImageId, SyncProfileId } from "./shared/services/database/database.seed";
import { MetadataReaderService } from "./mapping/data-transform/metadata-reader.service";
import { LastFmService } from "./shared/services/last-fm/last-fm.service";
import { MusicBrainzService } from "./shared/services/music-brainz/music-brainz.service";
import { IMbRecording, IMbSearchResponse } from "./shared/services/music-brainz/music-brainz.interface";
import { ImageService } from "./platform/image/image.service";
const MP3Tag = require('mp3tag.js');

/**
 * This is a service for testing purposes only.
 * It doesn't have any special functionality and it will be eventually removed.
 */
@Injectable({
  providedIn: 'root'
})
export class AppTestService {
  constructor(
    private log: LogService,
    private http: HttpClient,
    private exporter: ExportService,
    private dialog: DialogService,
    private fileService: FileService,
    private imageService: ImageService,
    private db: DatabaseService,
    private entities: DatabaseEntitiesService,
    private options: DatabaseOptionsService,
    private utility: UtilityService,
    private lookup: DatabaseLookupService,
    private storage: LocalStorageService,
    private metadataService: AudioMetadataService,
    private reader: MetadataReaderService,
    private mb: MusicBrainzService,
    private lastFm: LastFmService) {}

  public async test(): Promise<void> {
    //await this.logFileMetadata();
    await this.logStatistics();
    //this.hash();
    //await this.readSongClassification();
    //await this.readPlayHistory();
    //await this.readUserSong();
    //await this.readArtist();
    //await this.readPlaylists();
    //await this.readPlaylistSong();
    //await this.updatePlayCount();
    //await this.insertFilters();
    //await this.updateSong();
    //await this.getPlaylistsTracks();
    //await this.logPopularity();    
    //await this.getAvailableAlbumArt();
    //await this.testFileDates();
    //await this.getMbIds();

    // const genres = ['Rock', 'Pop', 'Jazz', 'Electronic', 'Folk', 'Hip-Hop', 'Country', 'R&B', 'Rap', 'Grupero', 'Ranchero', 'Urbano', 'Indie', 'Salsa'];
    // const newGenres = ['Soundtrack',];
    // await this.updateSongs('English', 'Hip-Hop', newGenres);
    // console.log('songs');
    // await this.updateImages('English', 'Hip-Hop', newGenres);
    // console.log('images');
    //await this.getAnimatedArtUrls();
    //await this.getAndStoreAnimatedArtList();
    //await this.updateImageSize();
  }

  private async logFileMetadata(): Promise<void> {
    const selectedFiles = this.dialog.openFileDialog();
    if (selectedFiles && selectedFiles.length) {
      // File info
      const fileInfo = await this.fileService.getFileInfo(selectedFiles[0]);
      this.log.warn('File info.', fileInfo);
      const buffer = await this.fileService.getBuffer(fileInfo.path);
      // Use music-metadata
      const audioInfo = await this.metadataService.getMetadata(buffer, this.utility.getMimeType(fileInfo.extension), true);
      this.log.warn('music-metadata.', audioInfo);
      // Use mp3tag
      const mp3Tag = new MP3Tag(buffer, true);
      mp3Tag.read();
      this.log.warn('mp3tag.js', mp3Tag.tags);
      // Display lyrics file content if exists
      const txtFile = selectedFiles[0].replace('.mp3', '.txt').replace('.flac', '.txt');
      if (txtFile.endsWith('.txt') && this.fileService.exists(txtFile)) {
        const lyrics = await this.fileService.getText(txtFile);
        console.log(lyrics);
      }
    }
  }

  private async readSongClassification(): Promise<void> {
    const fileContent = await this.fileService.getText('E:\\Downloads\\OrganisolData\\songClassification.json');
    const jsonObject = JSON.parse(fileContent);
    if (!jsonObject['SongClassification']) {
      return;
    }

    // Cache
    const classifications = await ValueListEntryEntity.find();
    const songs = await this.db.run('SELECT id, filePath FROM song') as any[];
    // New data
    const newSongClasses: SongClassificationEntity[] = [];

    const rows = jsonObject['SongClassification'];
    for (const row of rows) {
      const classType = row['ClassificationType'];
      if (classType === 'Language' || classType === 'Mood') {
        continue;
      }
      const filePath = row['FilePath'].toLowerCase();
      const className = row['ClassificationName'];
      const song = songs.find(s => s.filePath.toLowerCase() === filePath);
      if (!song) {
        console.log('Song not found: ' + filePath);
        continue;
      }
      let classification = classifications.find(c => c.name === className);
      if (!classification) {
        classification = new ValueListEntryEntity();
        classification.id = this.utility.newGuid();
        classification.name = className;
        classification.isClassification = true;
        classification.sequence = 0;
        classification.isNew = true;
        classification.hash = this.lookup.hashValueListEntry(classification.name);
        switch (classType) {
          case 'Subgenre':
            classification.valueListTypeId = ValueLists.Subgenre.id;
            break;
          case 'Category':
            classification.valueListTypeId = ValueLists.Category.id;
            break;
          case 'Instrument':
            classification.valueListTypeId = ValueLists.Instrument.id;
            break;
          case 'Occasion':
            classification.valueListTypeId = ValueLists.Occasion.id;
            break;
        }
        classifications.push(classification);
      }
      const newSongClass = new SongClassificationEntity();
      newSongClass.songId = song.id;
      newSongClass.classificationId = classification.id;
      newSongClass.classificationTypeId = classification.valueListTypeId;
      newSongClass.primary = row['Primary'];
      newSongClasses.push(newSongClass);
    }

    // Insert new records
    await this.db.bulkInsert(ValueListEntryEntity, classifications.filter(c => c.isNew));
    await this.db.bulkInsert(SongClassificationEntity, newSongClasses);
    console.log('done');
  }

  private async readPlayHistory(): Promise<void> {
    const fileContent = await this.fileService.getText('E:\\Downloads\\OrganisolData\\playHistory.json');
    const jsonObject = JSON.parse(fileContent);
    if (!jsonObject['PlayHistory']) {
      return;
    }

    // Cache
    const songs = await this.db.run('SELECT id, filePath FROM song') as any[];
    // New data
    const playHistoryRows: PlayHistoryEntity[] = [];

    const rows = jsonObject['PlayHistory'];
    for (const row of rows) {
      const filePath = row['FilePath'].toLowerCase();
      const song = songs.find(s => s.filePath.toLowerCase() === filePath);
      if (!song) {
        console.log('Song not found: ' + filePath);
        continue;
      }
      const playDate = new Date(row['AddDate']);
      const existingPlayHistory = playHistoryRows.find(h => h.songId === song.id && h.playDate.getDate() === playDate.getDate());
      if (!existingPlayHistory) {
        const newHistory = new PlayHistoryEntity();
        newHistory.songId = song.id;
        newHistory.playDate = playDate;
        playHistoryRows.push(newHistory);
      }
    }
    await this.db.bulkInsert(PlayHistoryEntity, playHistoryRows);
    console.log('done');
  }

  private async readUserSong(): Promise<void> {
    const fileContent = await this.fileService.getText('E:\\Downloads\\OrganisolData\\userSong.json');
    const jsonObject = JSON.parse(fileContent);
    if (!jsonObject['UserSong']) {
      return;
    }
    // Cache
    const songs = await SongEntity.find();

    const rows = jsonObject['UserSong'];
    for (const row of rows) {
      const filePath = row['FilePath'].toLowerCase();
      const song = songs.find(s => s.filePath.toLowerCase() === filePath);
      if (!song) {
        console.log('Song not found: ' + filePath);
        continue;
      }
      song.hasChanges = true;
      song.favorite = row['Favorite'];
      song.live = row['Live'];
      //song.explicit = row['Explicit'];
      song.rating = parseInt(row['Rating'].toString());
      song.playCount = row['PlayCount'];
      if (row['PlayDate']) {
        song.playDate = new Date(row['PlayDate']);
      }
      const moodLevel = row['MoodLevel'];
      switch (moodLevel) {
        case 0:
          song.mood = 'Unknown';
          break;
        case 0.5:
          song.mood = 'Depressed';
          break;
        case 1.0:
          song.mood = 'Sad';
          break;
        case 1.5:
          song.mood = 'Melancholy';
          break;
        case 2.0:
          song.mood = 'Indifferent';
          break;
        case 2.5:
          song.mood = 'Relaxed';
          break;
        case 3.0:
          song.mood = 'Peaceful';
          break;
        case 3.5:
          song.mood = 'Grateful';
          break;
        case 4.0:
          song.mood = 'Happy';
          break;
        case 4.5:
          song.mood = 'Excited';
          break;
        case 5.0:
          song.mood = 'Energetic';
          break;
      }
    }

    await this.db.bulkUpdate(SongEntity, songs.filter(s => s.hasChanges), ['favorite', 'rating', 'playCount', 'playDate', 'mood', 'live']);
    console.log('done');
  }

  private async readArtist(): Promise<void> {
    const fileContent = await this.fileService.getText('E:\\Downloads\\OrganisolData\\artist.json');
    const jsonObject = JSON.parse(fileContent);
    if (!jsonObject['Artist']) {
      return;
    }
    // Cache
    const artists = await ArtistEntity.find();
    const countries = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.Country.id });

    const rows = jsonObject['Artist'];
    for (const row of rows) {
      const name = row['Name'];
      const artist = artists.find(a => a.name.toLowerCase() === name.toLowerCase());
      if (!artist) {
        console.log('Artist not found: ' + name);
        continue;
      }

      artist.hasChanges = true;
      const artistType = row['ArtistType'];

      const country = row['Country'];
      let countryData = countries.find(c => c.name.toLowerCase() === country.toLowerCase());
      if (!countryData) {
        countryData = new ValueListEntryEntity();
        countryData.id = this.utility.newGuid();
        countryData.name = country;
        countryData.isClassification = false;
        // TODO: fix this later
        countryData.sequence = 0;
        countryData.isNew = true;
        countryData.hash = this.lookup.hashValueListEntry(countryData.name);
        countryData.valueListTypeId = ValueLists.Country.id;
        countries.push(countryData);
      }
      artist.country = country;

      switch (artistType) {
        case 'Unknown':
          // Don't do anything
          break;
        case 'Band':
          artist.artistType = 'Band';
          artist.vocal = false;
          break;
        case 'Band - Female Singer':
          artist.artistType = 'Band';
          artist.artistGender = 'Female';
          break;
        case 'Band - Male Singer':
          artist.artistType = 'Band';
          artist.artistGender = 'Male';
          break;
        case 'Band - Mixed Singers':
          artist.artistType = 'Band';
          artist.artistGender = 'Mixed';
          break;
        case 'Duo':
          artist.artistType = 'Duo';
          artist.vocal =false;
          break;
        case 'Duo - Female Singer':
          artist.artistType = 'Duo';
          artist.artistGender = 'Female';
          break;
        case 'Duo - Male Singer':
          artist.artistType = 'Duo';
          artist.artistGender = 'Male';
          break;
        case 'Duo - Mixed Singers':
          artist.artistType = 'Duo';
          artist.artistGender = 'Mixed';
          break;
        case 'Solo - Female':
          artist.artistType = 'Solo';
          artist.artistGender = 'Female';
          artist.vocal = false;
          break;
        case 'Solo - Female Singer':
          artist.artistType = 'Solo';
          artist.artistGender = 'Female';
          break;
        case 'Solo - Male':
          artist.artistType = 'Solo';
          artist.artistGender = 'Male';
          artist.vocal = false;
          break;
        case 'Solo - Male Singer':
          artist.artistType = 'Solo';
          artist.artistGender = 'Male';
          break;
        case 'Trio':
          artist.artistType = 'Trio';
          artist.vocal = false;
          break;
        case 'Trio - Female Singer':
          artist.artistType = 'Trio';
          artist.artistGender = 'Female';
          break;
        case 'Trio - Male Singer':
          artist.artistType = 'Trio';
          artist.artistGender = 'Male';
          break;
        case 'Trio - Mixed Singers':
          artist.artistType = 'Trio';
          artist.artistGender = 'Mixed';
          break;
      }
    }

    await this.db.bulkInsert(ValueListEntryEntity, countries.filter(c => c.isNew));
    await this.db.bulkUpdate(ArtistEntity, artists.filter(a => a.hasChanges), ['country', 'artistType', 'artistGender', 'vocal']);
    console.log('done');
  }

  private async readPlaylists(): Promise<void> {
    const fileContent = await this.fileService.getText('E:\\Downloads\\OrganisolData\\playlist.json');
    const jsonObject = JSON.parse(fileContent);
    if (!jsonObject['Playlist']) {
      return;
    }
    // Cache
    const playlists = await PlaylistEntity.find();

    const rows = jsonObject['Playlist'];
    for (const row of rows) {
      const id = row['PlaylistId'].toLowerCase();
      const name = row['Name'];
      if (name === 'Current') {
        continue;
      }
      let playlist = playlists.find(p => p.id === id);
      if (!playlist) {
        playlist = new PlaylistEntity();
        playlist.isNew = true;
        playlist.favorite = false;
        playlist.imported = false;
        playlist.changeDate = new Date();
        playlist.grouping = ValueLists.PlaylistGroup.entries.Default.name;
        playlist.id = id;
        playlist.name = name;
        playlist.hash = this.lookup.hashPlaylist(playlist.name);
        if (row['Description']) {
          playlist.description = row['Description'];
        }
        playlists.push(playlist);
      }
    }

    await this.db.bulkInsert(PlaylistEntity, playlists.filter(p => p.isNew));
    console.log('done');
  }

  private async readPlaylistSong(): Promise<void> {
    const fileContent = await this.fileService.getText('E:\\Downloads\\OrganisolData\\playlistSong.json');
    const jsonObject = JSON.parse(fileContent);
    if (!jsonObject['PlaylistSong']) {
      return;
    }
    // Cache
    const playlistSongs = await PlaylistSongEntity.find();
    const songs = await this.db.run('SELECT id, filePath FROM song') as any[];

    const rows = jsonObject['PlaylistSong'];

    for (const row of rows) {
      const filePath = row['FilePath'].toLowerCase();
      const song = songs.find(s => s.filePath.toLowerCase() === filePath);
      if (!song) {
        console.log('Song not found: ' + filePath);
        continue;
      }
      const track = new PlaylistSongEntity();
      track.playlistId = row['PlaylistId'].toLowerCase();
      track.songId = song.id;
      track.sequence = row['Sequence'];
      playlistSongs.push(track);
    }
    await this.db.bulkInsert(PlaylistSongEntity, playlistSongs);
    console.log('done');
  }

  private async updatePlayCount(): Promise<void> {
    const songs = await SongEntity.find();
    let songsWithMissingHistory = 0;
    let songsWithMoreThanOneMissingHistory = 0;
    for (const song of songs) {
      const playRecords = await PlayHistoryEntity.findBy({ songId: song.id });
      if (playRecords.length > song.playCount) {
        song.playCount = playRecords.length;
        await song.save();
        console.log('Song updated with more play count: ' + song.filePath);
      }
      else if (playRecords.length < song.playCount) {
        songsWithMissingHistory++;
        // Should we actually do something here?
        // Ideas: whatever date we use, add a second difference between each new record
        // 1- Epoch date (1970-01-01)
        // 2- File creation date
        const dif = song.playCount - playRecords.length;
        if (dif > 1) {
          songsWithMoreThanOneMissingHistory++;
        }
      }
    }
    if (songsWithMissingHistory) {
      console.log('Songs with missing history: ' + songsWithMissingHistory);
    }
    if (songsWithMoreThanOneMissingHistory) {
      console.log('Songs with more than one missing history: ' + songsWithMoreThanOneMissingHistory);
    }
  }

  private async insertFilters(): Promise<void> {
    // const dataToInsert: any = {
    //   inserts: {
    //     filter: [],
    //     filterCriteria: [],
    //     filterCriteriaItem: []
    //   }
    // };

    // const data = await this.db.getJsonData('user.data');
    // const tables = data['inserts'];

    // const filterRows = tables['filter'];
    // for (const row of filterRows) {
    //   let filter: FilterEntity;
    //   if (row['id']) {
    //     filter = await FilterEntity.findOneBy({ id: row['id']})
    //   }
    //   else if (row['name']) {
    //     filter = await FilterEntity.findOneBy({ name: row['name']})
    //   }

    //   if (!filter) {
    //     dataToInsert.inserts.filter.push(row);
    //   }
    // }

    // const filterCriteriaRows = tables['filterCriteria'];
    // for (const row of filterCriteriaRows) {
    //   let filterCriteria: FilterCriteriaEntity;
    //   if (row['id']) {
    //     filterCriteria = await FilterCriteriaEntity.findOneBy({ id: row['id']})
    //   }
    //   if (!filterCriteria) {
    //     dataToInsert.inserts.filterCriteria.push(row);
    //   }
    // }

    // const filterCriteriaItemRows = tables['filterCriteriaItem'];
    // for (const row of filterCriteriaItemRows) {
    //   let filterCriteriaItem: FilterCriteriaItemEntity;
    //   if (row['columnName']) {
    //     if (row['columnValue']) {
    //       filterCriteriaItem = await FilterCriteriaItemEntity.findOneBy({
    //         columnName: row['columnName'], columnValue: row['columnValue'].toString(), filterCriteriaId: row['filterCriteriaId'] })
    //     }
    //     else {
    //       filterCriteriaItem = await FilterCriteriaItemEntity.findOneBy({ columnName: row['columnName'], columnValue: IsNull(), filterCriteriaId: row['filterCriteriaId'] })
    //     }
    //   }
    //   if (!filterCriteriaItem) {
    //     dataToInsert.inserts.filterCriteriaItem.push(row);
    //   }
    // }

    // await this.db.insertData(dataToInsert);
    console.log('done');
  }

  private async updateSong(): Promise<void> {
    const songId = '812b370e-f5bd-5d66-5e41-fb2257cde2e5';
    const song = await SongEntity.findOneBy({ id: songId });
    song.filePath = 'G:\\Music\\English\\Electronic\\Air\\1998 - Moon Safari\\04 - kelly watch the stars.mp3';
    song.hash = this.lookup.hashSong(song.filePath);
    song.genre = 'Electronic';
    await song.save();

    const relatedImageId = '98753335-cdfc-426a-52e8-67fed69b750c';
    const relatedImage = await RelatedImageEntity.findOneBy({ id: relatedImageId });
    relatedImage.sourcePath = 'G:\\Music\\English\\Electronic\\Air\\1998 - Moon Safari\\front.jpg';
    relatedImage.hash = this.lookup.hashImage(relatedImage.sourcePath, relatedImage.sourceIndex);
    await relatedImage.save();
  }

  private async getPlaylistsTracks(): Promise<void> {
    const criteria = new Criteria();
    criteria.searchCriteria.addIgnore('sequence');
    const criteriaItem = criteria.searchCriteria.addIgnore('playlistId');
    criteriaItem.comparison = CriteriaComparison.Equals;
    criteriaItem.columnValues.push({ value: '8f029db4-96e4-4826-a411-68052607ac4e' });
    criteriaItem.columnValues.push({ value: '83402866-da7a-4ed2-9917-c67c3043c140' });
    // const criteria = new Criteria();
    // const criteriaItem = new CriteriaItem('playlistId', '8f029db4-96e4-4826-a411-68052607ac4e');
    // criteriaItem.columnValues.push({ value: '83402866-da7a-4ed2-9917-c67c3043c140' });
    // criteriaItem.ignoreInSelect = true;
    // criteria.searchCriteria.push(criteriaItem);
    // const sequenceItem = new CriteriaItem('sequence');
    // sequenceItem.ignoreInSelect = true;
    // criteria.searchCriteria.push(sequenceItem);
    const songs = await this.db.getList(SongExtendedByPlaylistViewEntity, criteria);
    console.log(songs);
  }

  private hash(): void {
    // Filters (name), Module Options (name)
    //const value = this.lookup.hashValues(['Fresh & Happy']);

    //const value = this.lookup.hashValueListEntry('Bachata');
    //const value = this.lookup.hashSong('G:\\Music\\Spanish\\Salsa\\Sonora Carruseles\\1998 - Heavy Salsa\\09 - micaela.mp3');
    const value = this.lookup.hashAlbum('Sketches For My Sweetheart The Drunk', 1998);
    //const value = this.lookup.hashImage('G:\\Music\\English\\Pop\\Sigala\\2017 - Came Here For Love (Acoustic) [Single]\\front.jpg', 0);
    //const value = this.lookup.hashArtist('Estela Raval');

    console.log(value);
  }

  private addMinimumData(entries: any[], entry: any, sequence: number): void {
    entries.push({
      sequence: sequence,
      method: entry.request.method,
      url: entry.request.url,
      size: entry.response.content.size,
      time: entry.time
    });
  }

  private addBasicData(entries: any[], entry: any): void {
    entries.push({
      request: {
        method: entry.request.method,
        url: entry.request.url,
        headers: entry.request.headers,
        queryString: entry.request.queryString,
        postData: entry.request.postData
      },
      response: {
        headers: entry.response.headers,
        content: entry.response.content
      },
      time: entry.time,
      timings: entry.timings
    });
  }

  private async logPopularity(): Promise<void> {
    // Get popularity of one year, and get only 10 results (songs).
    const entities = await this.entities.getSongPopularityByUnit(RelativeDateUnit.Year, 1, 10);
    console.log(entities);
    const songs = await SongEntity.findBy({ id: In(entities.map(e => e.id)) });
    for (const song of songs) {
      console.log(song.filePath);
    }
  }

  private async logStatistics(): Promise<void> {
    const queries: IValuePair[] = [];

    // ARTISTS -----------------------------------------------------

    // Artists by country
    //queries.push('SELECT country, COUNT(id) AS artistCount FROM artist GROUP BY country ORDER BY artistCount DESC');

    queries.push({
      caption: 'Artists with no country',
      value: `SELECT name FROM albumArtistView WHERE country = 'Unknown' ORDER BY name`
    });

    queries.push({
      caption: 'Songs by artist type',
      value: 'SELECT artistType, COUNT(id) AS artistCount FROM albumArtistView GROUP BY artistType ORDER BY artistCount DESC'
    });

    // ALBUMS ------------------------------------------------------

    queries.push({
      caption: 'Songs by album type',
      value: 'SELECT albumType, COUNT(id) AS albumCount FROM album GROUP BY albumType ORDER BY albumCount DESC'
    });

    queries.push({
      caption: 'Overall bitrate. Initial value: 225.477',
      value: 'SELECT AVG(bitrate) AS bitrateAverage FROM song WHERE vbr = 0'
    });

    queries.push({
      caption: 'Bitrate by decade',
      value: 'SELECT releaseDecade, AVG(bitrate) AS bitrateAverage FROM song GROUP BY releaseDecade ORDER BY releaseDecade'
    });

    queries.push({
      caption: 'Animated art count. Initial value: 451',
      value: 'SELECT COUNT(id) AS animatedArtCount FROM relatedImage WHERE imageType = "FrontAnimated"'
    });

    queries.push({
      caption: 'Animated art by decade',
      value: 'SELECT album.releaseDecade, COUNT(album.id) AS albumCount FROM album INNER JOIN relatedImage ON album.id = relatedImage.relatedId WHERE relatedImage.imageType = "FrontAnimated" GROUP BY album.releaseDecade'
    });

    // MOOD ----------------------------------------------------------
    queries.push({
      caption: 'Songs by mood. Initial Unknown value: 1173',
      value: 'SELECT mood, COUNT(id) AS songCount FROM song GROUP BY mood ORDER BY mood'
    });

    // GENRE ----------------------------------------------------------
    queries.push({
      caption: 'Songs by genre. Initial Other value: 885',
      value: 'SELECT genre, COUNT(id) AS songCount FROM song GROUP BY genre ORDER BY genre'
    });

    // DATES ----------------------------------------------------------

    queries.push({
      caption: 'Songs by artist no release year. Initial value: 36',
      value: 'SELECT primaryArtistName, COUNT(id) AS songCount FROM songView WHERE releaseYear = 0 GROUP BY primaryArtistName ORDER BY songCount DESC, primaryArtistName ASC'
    });

    queries.push({
      caption: '5 star songs by release year.',
      value: 'SELECT releaseYear, COUNT(id) AS songCount FROM song WHERE releaseYear > 0 AND rating = 5 GROUP BY releaseYear'
    });

    queries.push({
      caption: 'Songs added by year',
      value: `SELECT STRFTIME('%Y', addDate) AS addYear, COUNT(id) AS songCount FROM song GROUP BY addYear ORDER BY addYear`
    });

    queries.push({
      caption: 'Songs added by year/month',
      value: `SELECT STRFTIME('%Y', addDate) AS addYear, STRFTIME('%m', addDate) AS addMonth, COUNT(id) AS songCount FROM song GROUP BY addYear, addMonth ORDER BY addYear, addMonth`
    });

    queries.push({
      caption: 'Songs added by year/language',
      value: `SELECT STRFTIME('%Y', addDate) AS addYear, language, COUNT(id) AS songCount FROM song GROUP BY addYear, language ORDER BY addYear, language`
    });

    queries.push({
      caption: 'Songs added by year/release decade',
      value: `SELECT STRFTIME('%Y', addDate) AS addYear, releaseDecade, COUNT(id) AS releaseDecadeCount FROM song GROUP BY addYear, releaseDecade ORDER BY addYear, releaseDecade`
    });

    // Songs added by add year/release year
    //queries.push(`SELECT STRFTIME('%Y', addDate) AS addYear, releaseYear, COUNT(id) AS releaseYearCount FROM song GROUP BY addYear, releaseYear ORDER BY addYear, releaseYear`);

    // QUALITY ------------------------------------------------------------

    queries.push({
      caption: 'Low quality songs by artist. Initial artist count: 1046',
      value: 'SELECT primaryArtistName, COUNT(id) AS songCount FROM songView WHERE bitrate < 320000 AND vbr = 0 GROUP BY primaryArtistName ORDER BY songCount DESC, primaryArtistName ASC'
    });

    queries.push({
      caption: 'Poor quality song count',
      value: 'SELECT bitrate, filePath FROM song WHERE bitrate < 128000 ORDER BY bitrate ASC'
    });

    queries.push({
      caption: 'Replaced songs by year/month',
      value: `SELECT STRFTIME('%Y', replaceDate) || '/' || STRFTIME('%m', replaceDate) as replaceYearMonth, count(id) AS fileCount FROM song WHERE replaceDate IS NOT NULL GROUP BY replaceYearMonth`
    });

    // High quality songs updated after 2022-07-01 and added before 2022-07-01
    //queries.push(`SELECT changeDate, filePath FROM song WHERE (bitrate = 320000 OR VBR = 1) AND changeDate > '2022-07-01' AND addDate < '2022-07-01' ORDER BY changeDate ASC`);

    queries.push({
      caption: 'Low quality percentage. Initial value: 40.15',
      value: `
        SELECT allSongs.count AS allSongsCount, lowSongs.count AS lowSongsCount, (CAST(lowSongs.count AS float) / allSongs.count) * 100 AS lowQualityPercentage
        FROM
        (SELECT COUNT(*) AS count FROM song) AS allSongs, (SELECT COUNT(*) AS count FROM song WHERE bitrate < 320000 AND Vbr = 0) AS lowSongs
      `
    });

    for (const query of queries) {
      const result = await this.db.run(query.value);
      if (query.caption) {
        console.log(query.caption);
      }
      else {
        console.log('');
      }
      console.log(result);
      console.log('');
    }
  }

  /**
   * Uses the apple api to search the specified album and get its metadata (especially if it has animated art).
   * This method requires to setup the supported origin in the main.ts.
   */
  private async getAlbumMetadata(albumRow: AlbumViewEntity): Promise<any> {
    const albumMetadata = { searchUrl: '', id: albumRow.id, url: '', hasAnimatedArt: false, artistName: albumRow.primaryArtistName, albumName: albumRow.albumStylized, error: null };
    const token = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IldlYlBsYXlLaWQifQ.eyJpc3MiOiJBTVBXZWJQbGF5IiwiaWF0IjoxNzc0ODk2NTE3LCJleHAiOjE3ODIxNTQxMTcsInJvb3RfaHR0cHNfb3JpZ2luIjpbImFwcGxlLmNvbSJdfQ.Rr-x075Wm_iiqd0AhxcGEsZsIOnaM6eSLGSe1Ou7_SQsC0AFuVcX9qFtv-icBdPnbKSuZJOHm_JH1QwyS4DC8g';
    albumMetadata.searchUrl = `https://amp-api.music.apple.com/v1/catalog/us/search?types=albums&extend=editorialVideo&term=` + encodeURIComponent(albumMetadata.albumName + ' ' + albumMetadata.artistName);
    
    try {
      const response = await this.http.get(albumMetadata.searchUrl, { headers: { authorization: 'Bearer ' + token }}).toPromise();
      const searchData = response as any;
      if (searchData?.results?.albums?.data?.length) {
        const album = searchData.results.albums.data[0];
        albumMetadata.url = album.attributes.url;
        if (album?.attributes?.editorialVideo?.motionSquareVideo1x1?.video) {
          albumMetadata.hasAnimatedArt = true;
        }
      }
    }
    catch (err: any) {
      if (err.status === 401) {
        albumMetadata.error = 'Invalid token.';
      }
      else {
        albumMetadata.error = err;
      }
    }
    
    return albumMetadata;
  }

  /**
   * Iterates all the existing albums with no animated art in the db, and stores a list of metadata with animated art in local storage.
   * If the album was already processed, it won't be processed again until it is deleted from local storage.
   * @returns 
   */
  private async getAndStoreAnimatedArtList(): Promise<void> {
    let albums = await AlbumViewEntity.find();
    albums = this.utility.sort(albums, 'primaryArtistName');
    console.log('Total albums: ' + albums.length);

    let albumMetadataItems = this.storage.getByKey<any[]>('sp.AnimatedArtAlbums');
    if (!albumMetadataItems) {
      albumMetadataItems = [];
    }
    
    for (const album of albums) {
      console.log(album.primaryArtistName + ' ' + album.albumStylized);
      const animatedArt = await RelatedImageEntity.findOneBy({ relatedId: album.id, imageType: MusicImageType.FrontAnimated });
      if (!animatedArt) {
        const frontArt = await RelatedImageEntity.findOneBy({ relatedId: album.id, imageType: MusicImageType.Front });
        // Only look for animated art if it has regular art
        if (frontArt) {
          let albumMetadata = albumMetadataItems.find(i => i.id === album.id);
          // Continue looking in the apple api only if it hasn't been processed yet
          if (!albumMetadata) {
            albumMetadata = await this.getAlbumMetadata(album);
            if (albumMetadata.hasAnimatedArt) {
              albumMetadataItems.push(albumMetadata);
              this.storage.setByKey('sp.AnimatedArtAlbums', albumMetadataItems);
              console.log('%c%s', `color: #e9ff25`, 'Album has animated art in apple.');
            }
            else if (albumMetadata.error) {
              console.log('%c%s','color: #cc0000', 'Album error:');
              console.log(albumMetadata.error);
            }
            else {
              console.log('%c%s', 'color: #2a9fd6', 'Album without animated art in apple.');
            }
            await this.utility.sleep(2000);
          }
          else {
            console.log('%c%s', `color: #2a9fd6`, 'Album already processed.');
          }
        }
        else {
          console.log('%c%s', `color: #2a9fd6`, 'Album does not have cover in the db.');
        }
      }
      else {
        console.log('%c%s', `color: #2a9fd6`, 'Album has animated art in the db.');
      }
    }
    console.log('Done');
  }

  /**
   * Just a temporary method to get urls of all albums with animated art.
   */
  private async getAnimatedArtUrls(): Promise<void> {
    const albumMetadata = this.storage.getByKey<any[]>('sp.AnimatedArtAlbums');
    const jsonString = JSON.stringify(albumMetadata, null, 4);
    await this.fileService.writeText('animatedUrls.json', jsonString);
    console.log('Done');
  }

  /**
   * Updates the genres of all songs that match the specified genre and language.
   * @param newGenres 
   */
  private async updateSongs(language: string, genre: string, newGenres: string[]): Promise<void> {
    const songs = await SongEntity.findBy({ genre: In([genre]), language: In([language]) });
    for (const song of songs) {
      if (!this.fileService.exists(song.filePath)) {
        const result = await this.updateSongGenre(song, genre, newGenres);
        console.log(`Song updated: ${result} ${song.filePath}`);
      }
    }
  }

  private async updateSongGenre(song: SongEntity, genre: string, newGenres: string[]): Promise<boolean> {
    for (const newGenre of newGenres) {
      const newPath = song.filePath.replace(`\\${genre}\\`, `\\${newGenre}\\`);
      if (this.fileService.exists(newPath)) {
        song.filePath = newPath;
        song.genre = newGenre;
        song.hash = this.lookup.hashSong(newPath);
        await song.save();
        return true;
      }
    }
    return false;
  }

  // private async updateSongLanguage(song: SongEntity, newLanguage: string): Promise<boolean> {
  //   const newPath = song.filePath.replace('\\None\\', `\\${newLanguage}\\`);
  //   if (this.fileService.exists(newPath)) {
  //     if (song.language === 'Various') {
  //       song.language = newLanguage;
  //     }
  //     song.filePath = newPath;
  //     song.hash = this.lookup.hashSong(newPath);
  //     await song.save();
  //     return true;
  //   }
  //   return false;
  // }

  /**
   * Updates hash and sourcePath of relatedImage records with new genre.
   * @param languageFolder 
   * @param genreFolder 
   * @param newGenres 
   */
  private async updateImages(languageFolder: string, genreFolder: string, newGenres: string[]): Promise<void> {
    const images1 = await RelatedImageEntity.findBy({ sourcePath: Like(`D:\\Mp3\\${languageFolder}\\${genreFolder}\\%`)});
    //const images2 = await RelatedImageEntity.findBy({ sourcePath: Like('G:\\Music\\Spanish\\Other\\%')});
    //const images = images1.concat(images2);
    for (const image of images1) {
      if (!this.fileService.exists(image.sourcePath)) {
        for (const newGenre of newGenres) {
          const newPath = image.sourcePath.replace(`\\${genreFolder}\\`, `\\${newGenre}\\`);
          if (this.fileService.exists(newPath)) {
            image.sourcePath = newPath;
            image.hash = this.lookup.hashImage(newPath, 0);
            await image.save();
            console.log(`Image updated: ${image.sourcePath}`);
          }
        }
      }
    }
  }

  private async testFileDates(): Promise<void> {
    // The windows properties shows: Saturday, June 17, 2023, 4:32:34 PM
    const filePath = `D:\\Mp3\\English\\Country\\Chris Stapleton\\2015 - Traveller\\03 - tennessee whiskey.mp3`;
    let info = await this.fileService.getFileInfo(filePath);
    console.log(info.addDate); // Sat Jun 17 2023 17:32:34 GMT-0500 (Central Daylight Time)
    const d = new Date('2023-06-17 16:32:34.000');
    // It looks like JS assumes the date is in the current time zone and for some reason it assumes the time zone is GMT-5
    console.log(d); // Sat Jun 17 2023 16:32:34 GMT-0500 (Central Daylight Time)
    console.log(d.toISOString()); // 2023-06-17T21:32:34.000Z
    console.log(d.getTimezoneOffset()); // 300
    const r = await this.fileService.setAddDate(filePath, d);
    // Printing local and utc time, which means local time is UTC-06:00
    console.log(r); // Saturday, June 17, 2023, 4:32:34 PM, 6/17/2023 4:32:34 PM, 6/17/2023 10:32:34 PM
    info = await this.fileService.getFileInfo(filePath);
    console.log(info.addDate); // Sat Jun 17 2023 17:32:34 GMT-0500 (Central Daylight Time)
    console.log(info.addDate.toISOString());

    // PROBLEM
    // file add date seems to be "6/17/2023 10:32:34 PM UTC" based on the log reported by c# command app
    // in properties it shows up as "Saturday, June 17, 2023, 4:32:34 PM" which is GMT-6
    // debugging file.addDate = "Sat Jun 17 2023 17:32:34 GMT-0500 GMT-5" which, although it is not the proper timezone, the time is still correct
    // I create a new date object in JS using this string: "2023-06-17 16:32:34.000"
    // The date is actually created as "2023-06-17 21:32:34.000" because it assumes the string is local time and applies offset (GMT-5) to convert to UTC
    // At this point there's already a discrepancy, file is 10:32UTC and new date is 09:32UTC
    // This date is converted to ticks
    // The original ticks value is: 638226343540000000 which properly represents: 2023-06-17​T21:32:34.000Z
    // Then, removing the offset changes the ticks value to 638226163540000000 which represents: 2023-06-17​T16:32:34.000Z
    // This happens because the offset was substracted: 300 minutes (5 hours) and the date ends up being the same value created from the string
    // This value (in ticks) gets to the C# command line and assumes it is the local time zone: 6/17/2023 4:32:34 PM which is GMT-6
    // The same value converted to UTC is: 6/17/2023 10:32:34 PM
    // SUMMARY
    // Seeing local times in JS debugging console and file properties is the same
    // But in reality, the UTC on both are different because with JS is GMT-5 and with file props is GMT-6
    // FIX?
    // Set add date in UTC, js dates are time agnostic so offset doesn't have to be removed
    // And make sure the cmd app assumes the input date is utc
  }

  private async testMetadataReader(): Promise<void> {
    const fileInfo = await this.fileService.getFileInfo('D:\\Mp3\\Spanish\\Pop\\Jacinto\\2025 - (¦(\\01 - amar esta raro [feat daaz].mp3');
    const syncProfile = await this.entities.getSyncProfile(SyncProfileId.DefaultAudioImport);
    const dataSources = await this.entities.getDataSources(syncProfile.id);
    await this.reader.init(syncProfile, dataSources);
    const metadata = await this.reader.run(fileInfo);
    console.log(metadata);
  }

  private async getMbIds(): Promise<void> {
    let processedSongs = this.storage.getByKey<any[]>('sp.tempMbIdProcessedSongs');
    if (!processedSongs) {
      processedSongs = [];
    }
    const criteria = new Criteria();
    let criteriaItem = new CriteriaItem('primaryAlbumName', 'Unknown', CriteriaComparison.NotEquals);
    criteria.searchCriteria.push(criteriaItem);
    criteriaItem = new CriteriaItem('releaseYear', 0, CriteriaComparison.NotEquals);
    criteria.searchCriteria.push(criteriaItem);
    criteriaItem = new CriteriaItem('mbId', null, CriteriaComparison.IsNull);
    criteria.searchCriteria.push(criteriaItem);
    criteria.addSorting('primaryArtistName');
    const songs = await this.db.getList(SongExtendedViewEntity, criteria);
    console.log('Songs with no mbid: ' + songs.length);
    console.log('Songs processed: ' + processedSongs.length);
    console.log('Songs left: ' + (songs.length - processedSongs.length).toString());
    for (const song of songs) {
      const item = processedSongs.find(i => i.id === song.id);
      if (item) {
        continue;
      }
      let artistName = song.primaryArtistStylized;
      if (song.primaryArtistName == 'Various' && song.featuring !== undefined && song.featuring !== null) {
        artistName = song.featuring;
      }
      let response: IMbSearchResponse;
      try {
        response = await this.mb.searchTrack(song.title, artistName, song.primaryAlbumStylized);
        // Only one request per second is allowed
        await this.utility.sleep(1000);
      }
      catch (err) {
        console.log('Error searching track info.');
        console.log(err);
        this.storage.setByKey('sp.tempMbIdProcessedSongs', processedSongs);
        return;
      }
      let recording: IMbRecording;
      if (response.recordings.length === 1) {
        recording = response.recordings[0];
      }
      else {
        for (const rec of response.recordings) {
          const recNormalized = this.utility.normalize(rec.title.toLocaleLowerCase());
          const songNormalized = this.utility.normalize(song.title);
          if (recNormalized === songNormalized || recNormalized === songNormalized.replace(`'`, '’')) {
            recording = rec;
          }
        }
      }

      if (recording) {
        const songToUpdate = await SongEntity.findOneBy({ id: song.id });
        songToUpdate.mbId = recording.id;
        await songToUpdate.save();
        console.log(`1 matches found for: ${song.title} - ${artistName} - ${song.primaryAlbumStylized} - ${song.releaseYear}.`);
      }
      else {
        const metadata = { id: song.id, matchCount: response.recordings.length, recordings: [], title: song.title, artist: artistName, album: song.primaryAlbumStylized, year: song.releaseYear, url: response.url };
        metadata.recordings = response.recordings.map(rec => { return { mbId: rec.id, title: rec.title } });
        processedSongs.push(metadata);
        this.storage.setByKey('sp.tempMbIdProcessedSongs', processedSongs);
        console.log(`${response.recordings.length} matches found for: ${song.title} - ${artistName} - ${song.primaryAlbumStylized} - ${song.releaseYear}.`);
      }
    }
  }

  private async updateImageSize(): Promise<void> {
    let relatedImages = await RelatedImageEntity.find();
    relatedImages = this.utility.sort(relatedImages, 'sourcePath');
    for (const relatedImage of relatedImages) {
      if (!relatedImage.height || !relatedImage.width) {
        try {
          let imageSize: ISize;
          if (relatedImage.sourceType === MusicImageSourceType.ImageFile) {
            imageSize = await this.imageService.getImageSize(this.utility.fileToUrl(relatedImage.sourcePath));
          }
          else if (relatedImage.sourceType === MusicImageSourceType.Url) {
            imageSize = await this.imageService.getImageSize(relatedImage.sourcePath);
          }
          else {
            continue;
          }
          
          relatedImage.height = imageSize.height;
          relatedImage.width = imageSize.width;
          await relatedImage.save();
          console.log(`${relatedImage.sourcePath} ${relatedImage.height}X${relatedImage.width}`);
        }
        catch (err) {
          console.log('%c%s', 'color: red', relatedImage.sourcePath);
          console.log(err);
        }
      }
    }
    console.log('Done');
  }
}