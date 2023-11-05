import { Injectable } from "@angular/core";
import { ModuleOptionId } from "./shared/services/database/database.seed";
import { ExportService } from "./sync-profile/export/export.service";
import { DialogService } from "./platform/dialog/dialog.service";
import { FileService } from "./platform/file/file.service";
import { AudioMetadataService } from "./platform/audio-metadata/audio-metadata.service";
import { LogService } from "./core/services/log/log.service";
import { DatabaseService } from "./shared/services/database/database.service";
import { DatabaseEntitiesService } from "./shared/services/database/database-entities.service";
import { DatabaseOptionsService } from "./shared/services/database/database-options.service";
import { ArtistEntity, FilterCriteriaEntity, FilterCriteriaItemEntity, FilterEntity, PlayHistoryEntity, PlaylistEntity, PlaylistSongEntity, RelatedImageEntity, SongClassificationEntity, SongEntity, SongExtendedByPlaylistViewEntity, SongExtendedViewEntity, ValueListEntryEntity } from "./shared/entities";
import { UtilityService } from "./core/services/utility/utility.service";
import { ValueLists } from "./shared/services/database/database.lists";
import { DatabaseLookupService } from "./shared/services/database/database-lookup.service";
import { IsNull } from "typeorm";
import { Criteria, CriteriaItem } from "./shared/services/criteria/criteria.class";
import { CriteriaComparison } from "./shared/services/criteria/criteria.enum";
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
    private exporter: ExportService,
    private dialog: DialogService,
    private fileService: FileService,
    private db: DatabaseService,
    private entities: DatabaseEntitiesService,
    private options: DatabaseOptionsService,
    private utility: UtilityService,
    private lookup: DatabaseLookupService,
    private metadataService: AudioMetadataService) {}

  public async test(): Promise<void> {
    //await this.logFileMetadata();
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
    //await this.logStatistics();
    this.hash();
  }

  private async logFileMetadata(): Promise<void> {
    const selectedFiles = this.dialog.openFileDialog();
    if (selectedFiles && selectedFiles.length) {
      // File info
      const fileInfo = await this.fileService.getFileInfo(selectedFiles[0]);
      this.log.warn('File info.', fileInfo);
      const buffer = await this.fileService.getBuffer(fileInfo.path);
      // Use music-metadata
      const audioInfo = await this.metadataService.getMetadata(buffer, this.utility.getMimeType(fileInfo.extension.replace('.', '')), true);      
      this.log.warn('music-metadata.', audioInfo);
      // Use mp3tag
      const mp3Tag = new MP3Tag(buffer, true);
      mp3Tag.read();
      this.log.warn('mp3tag.js', mp3Tag.tags);
      // Display lyrics content
      const txtFile = selectedFiles[0].replace('.mp3', '.txt');
      if (this.fileService.exists(txtFile)) {
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
      song.explicit = row['Explicit'];
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

    await this.db.bulkUpdate(SongEntity, songs.filter(s => s.hasChanges), ['favorite', 'rating', 'playCount', 'playDate', 'mood', 'live', 'explicit']);
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
    //const value = this.lookup.hashValueListEntry('China');
    //const value = this.lookup.hashValues(['Symfonium Player']);
    const value = this.lookup.hashArtist('Al Di Meola');

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

  private async logStatistics(): Promise<void> {
    const queries: string[] = [];
    queries.push('SELECT country, COUNT(id) AS artistCount FROM artist GROUP BY country ORDER BY artistCount DESC');
    queries.push('SELECT artistType, COUNT(id) AS artistCount FROM artist GROUP BY artistType ORDER BY artistCount DESC');
    queries.push('SELECT AVG(bitrate) AS bitrateAverage FROM song WHERE vbr = 0'); // 225.477
    queries.push('SELECT releaseDecade, AVG(bitrate) FROM song GROUP BY releaseDecade ORDER BY releaseDecade');
    queries.push('SELECT mood, COUNT(id) AS songCount FROM song GROUP BY mood ORDER BY mood'); // Unknown: 1773
    queries.push(`SELECT strftime('%Y', addDate) AS addYear, COUNT(id) AS songCount FROM song GROUP BY addYear ORDER BY addYear`);
    queries.push(`SELECT strftime('%Y', addDate) AS addYear, language, COUNT(id) AS songCount FROM song GROUP BY addYear, language ORDER BY addYear, language`);
    queries.push(`SELECT strftime('%Y', addDate) AS addYear, strftime('%m', addDate) AS addMonth, COUNT(id) AS songCount FROM song GROUP BY addYear, addMonth ORDER BY addYear, addMonth`);
    queries.push(`SELECT strftime('%Y', addDate) AS addYear, releaseDecade, COUNT(id) AS releaseDecadeCount FROM song GROUP BY addYear, releaseDecade ORDER BY addYear, releaseDecade`);
    queries.push(`SELECT strftime('%Y', addDate) AS addYear, releaseYear, COUNT(id) AS releaseYearCount FROM song GROUP BY addYear, releaseYear ORDER BY addYear, releaseYear`);
    queries.push('SELECT primaryArtistName, COUNT(id) AS songCount FROM songView WHERE bitrate < 320000 AND vbr = 0 GROUP BY primaryArtistName ORDER BY songCount DESC');
    queries.push('SELECT bitrate, filePath FROM song WHERE bitrate < 128000 ORDER BY bitrate ASC');
    queries.push(`SELECT changeDate, filePath FROM song WHERE (bitrate = 320000 OR VBR = 1) AND changeDate > '2022-07-01' AND addDate < '2022-07-01' ORDER BY changeDate ASC`);
    queries.push(`
      SELECT allSongs.count AS allSongsCount, lowSongs.count AS lowSongsCount, (CAST(lowSongs.count AS float) / allSongs.count) * 100 AS lowQualityPercentage
      FROM
      (SELECT COUNT(*) AS count FROM song) AS allSongs, (SELECT COUNT(*) AS count FROM song WHERE bitrate < 320000 AND Vbr = 0) AS lowSongs
    `); // 40.15

    for (const query of queries) {
      const result = await this.db.run(query);
      console.log(result);
    }
  }
}