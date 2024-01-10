import { ViewColumn } from "typeorm";
import { ISongExtendedModel, ISongModel } from "../models/song-model.interface";
import { SongBaseEntity } from "./song-base.entity";
import { dateTransformer } from "./date-transformer";

export const songViewBaseSelect = `
SELECT song.id, song.name, song.cleanName, song.hash,
song.primaryAlbumId, song.filePath, song.fileExtension, song.fileSize,
song.trackNumber, song.mediaNumber, song.releaseYear, song.releaseDecade, song.rating, song.playCount,
song.performerCount, song.genre, song.mood, song.language, song.lyrics,
song.seconds, song.duration, song.bitrate, song.frequency, song.vbr,
song.favorite, song.live, song.explicit, song.addDate, song.changeDate, song.playDate,
album.name AS primaryAlbumName, album.primaryArtistId AS primaryArtistId,
artist.name AS primaryArtistName, artist.artistStylized AS primaryArtistStylized
`;

export const songViewBaseJoins =`
FROM %songTable% AS song
INNER JOIN album
ON song.primaryAlbumId = album.id
INNER JOIN artist
ON album.primaryArtistId = artist.id
`;

/**
 * Base class that includes all columns for any view implementing the ISongModel interface.
 * Fields: id, name, hash, primaryAlbumId, filePath, fileExtension, fileSize,
 * trackNumber, mediaNumber, releaseYear, releaseDecade, rating, playCount,
 * performerCount, genre, mood, language, lyrics, seconds, duration, bitrate, frequency, vbr,
 * favorite, live, explicit, addDate, playDate, primaryAlbumName, primaryArtistId,
 * primaryArtistName, primaryArtistStylized.
 * Excluded fields:
 * externalId, cleanName, titleSort, subtitle, featuring, grouping, composer, composerSort,
 * primaryAlbumSort, primaryAlbumStylized, primaryAlbumType, country, primaryArtistSort, primaryArtistType,
 * originalArtist, originalAlbum, originalReleaseYear, comment,
 * infoUrl, videoUrl, replayGain, tempo, addYear, changeDate, replaceDate
 */
export class SongViewBaseEntity extends SongBaseEntity implements ISongModel {
  // Base entity
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  hash: string;
  // Ids
  @ViewColumn()
  primaryAlbumId: string;
  // File info
  @ViewColumn()
  filePath: string;
  @ViewColumn()
  fileExtension: string;
  @ViewColumn()
  fileSize: number;
  // Song info
  @ViewColumn()
  cleanName: string;
  @ViewColumn()
  trackNumber: number;
  @ViewColumn()
  mediaNumber: number;
  @ViewColumn()
  releaseYear: number;
  @ViewColumn()
  releaseDecade: number;
  @ViewColumn()
  rating: number;
  @ViewColumn()
  playCount: number;
  @ViewColumn()
  performerCount: number;
  @ViewColumn()
  genre: string;
  @ViewColumn()
  mood: string;
  @ViewColumn()
  language: string;
  @ViewColumn()
  lyrics: string;
  // Audio info
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  duration: string;
  @ViewColumn()
  bitrate: number;
  @ViewColumn()
  frequency: number;
  @ViewColumn()
  vbr: boolean;
  // Flags
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  live: boolean;
  @ViewColumn()
  explicit: boolean;
  // Dates
  @ViewColumn({ transformer: dateTransformer })
  addDate: Date;
  @ViewColumn({ transformer: dateTransformer })
  changeDate: Date;
  @ViewColumn({ transformer: dateTransformer })
  playDate: Date;
  // Join info  
  @ViewColumn()
  primaryAlbumName: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  primaryArtistName: string;
  @ViewColumn()
  primaryArtistStylized: string;
  // Optional info
  artistId: string;
  classificationId: string;
  playlistId: string;
}

export const songExtendedViewSelect = `
SELECT song.id, song.name, song.cleanName, song.hash, song.primaryAlbumId, song.externalId, song.originalSongId,
song.filePath, song.fileExtension, song.fileSize,
song.titleSort, song.subtitle, song.featuring, song.trackNumber, song.mediaNumber, song.mediaSubtitle, song.releaseYear, song.releaseDecade,
song.rating, song.playCount, song.performerCount, song.genre, song.mood, song.language,
song.lyrics, song.grouping, song.composer, song.composerSort, song.comment,
song.originalArtist, song.originalAlbum, song.originalReleaseYear, song.infoUrl, song.videoUrl,
song.seconds, song.duration, song.bitrate, song.frequency, song.vbr, song.replayGain, song.tempo,
song.favorite, song.live, song.explicit, song.addDate, song.addYear, song.changeDate, song.playDate, song.replaceDate,
album.name AS primaryAlbumName, album.albumSort AS primaryAlbumSort, album.albumStylized AS primaryAlbumStylized, album.albumType AS primaryAlbumType, album.publisher AS primaryAlbumPublisher, album.primaryArtistId,
artist.country, artist.name AS primaryArtistName, artist.artistSort AS primaryArtistSort, artist.artistStylized AS primaryArtistStylized, artist.artistType AS primaryArtistType
`;

/**
 * Base class that extends the song view base entity with extra fields from the song and other tables.
 */
export class SongExtendedViewBaseEntity extends SongViewBaseEntity implements ISongExtendedModel {
  @ViewColumn()
  externalId: string;
  @ViewColumn()
  originalSongId: string;
  @ViewColumn()
  titleSort: string;
  @ViewColumn()
  subtitle: string;
  @ViewColumn()
  mediaSubtitle: string;
  @ViewColumn()
  featuring: string;
  @ViewColumn()
  grouping: string;
  @ViewColumn()
  composer: string;
  @ViewColumn()
  composerSort: string;
  @ViewColumn()
  originalArtist: string;
  @ViewColumn()
  originalAlbum: string;
  @ViewColumn()
  originalReleaseYear: number;
  @ViewColumn()
  comment: string;
  @ViewColumn()
  infoUrl: string;
  @ViewColumn()
  videoUrl: string;
  @ViewColumn()
  replayGain: number;
  @ViewColumn()
  tempo: number;
  @ViewColumn()
  addYear: number;
  @ViewColumn({ transformer: dateTransformer })
  replaceDate: Date;
  @ViewColumn()
  country: string;
  @ViewColumn()
  primaryAlbumSort: string;
  @ViewColumn()
  primaryAlbumStylized: string;
  @ViewColumn()
  primaryAlbumType: string;
  @ViewColumn()
  primaryAlbumPublisher: string;
  @ViewColumn()
  primaryArtistSort: string;
  @ViewColumn()
  primaryArtistType: string;
}