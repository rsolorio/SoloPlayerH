import { Injectable } from "@angular/core";
import { ModuleOptionId } from "./shared/services/database/database.seed";
import { ExportService } from "./shared/services/export/export.service";
import { DialogService } from "./platform/dialog/dialog.service";
import { FileService } from "./platform/file/file.service";
import { AudioMetadataService } from "./platform/audio-metadata/audio-metadata.service";
import { LogService } from "./core/services/log/log.service";
import { MimeType } from "./core/models/core.enum";
import { DatabaseService } from "./shared/services/database/database.service";
import { DatabaseEntitiesService } from "./shared/services/database/database-entities.service";
import { DatabaseOptionsService } from "./shared/services/database/database-options.service";
import { ArtistEntity, PlayHistoryEntity, PlaylistEntity, PlaylistSongEntity, SongClassificationEntity, SongEntity, ValueListEntryEntity } from "./shared/entities";
import { UtilityService } from "./core/services/utility/utility.service";
import { ValueLists } from "./shared/services/database/database.lists";
import { DatabaseLookupService } from "./shared/services/database/database-lookup.service";

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
    await this.testExporter();
    //await this.updatePlayCount();
  }

  private testExporter(): void {
    const exportProfileId = this.options.getText(ModuleOptionId.DefaultExportProfile);
    this.exporter.run(exportProfileId).then(() => {
      console.log('done');
    });
  }

  private async logFileMetadata(): Promise<void> {
    const selectedFiles = this.dialog.openFileDialog();
    if (selectedFiles && selectedFiles.length) {
      const fileInfo = await this.fileService.getFileInfo(selectedFiles[0]);
      const buffer = await this.fileService.getBuffer(fileInfo.path);
      const audioInfo = await this.metadataService.getMetadata(buffer, MimeType.Mp3, true);
      // As warning to bypass the default log config
      this.log.warn('File info.', fileInfo);
      this.log.warn('Audio info.', audioInfo);
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
}