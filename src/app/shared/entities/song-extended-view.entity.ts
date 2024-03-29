import { ViewColumn, ViewEntity } from "typeorm";
import { PartyRelationType } from "../models/music.enum";
import { SongExtendedViewBaseEntity, songExtendedViewSelect, songViewBaseJoins } from "./song-view-base.entity";

// SONG TABLE
@ViewEntity({
  name: 'songExtendedView',
  expression: `
  ${songExtendedViewSelect} ${songViewBaseJoins.replace('%songTable%', 'song')}
`})
export class SongExtendedViewEntity extends SongExtendedViewBaseEntity {
}

@ViewEntity({
  name: 'songExtendedByArtistView',
  expression: `
  ${songExtendedViewSelect}, partyRelation.relatedId AS artistId
  ${songViewBaseJoins.replace('%songTable%', 'song')}
  INNER JOIN partyRelation
  ON song.id = partyRelation.songId
  WHERE partyRelation.relationTypeId = '${PartyRelationType.Primary}'
  OR partyRelation.relationTypeId = '${PartyRelationType.Featuring}'
`})
export class SongExtendedByArtistViewEntity extends SongExtendedViewBaseEntity {
  @ViewColumn()
  artistId: string;
}

@ViewEntity({
  name: 'songExtendedByClassificationView',
  expression: `
  ${songExtendedViewSelect}, songClassification.classificationId AS classificationId
  ${songViewBaseJoins.replace('%songTable%', 'song')}
  INNER JOIN songClassification
  ON song.id = songClassification.songId
`})
export class SongExtendedByClassificationViewEntity extends SongExtendedViewBaseEntity {
  @ViewColumn()
  classificationId: string;
}

@ViewEntity({
  name: 'songExtendedByPlaylistView',
  expression: `
  ${songExtendedViewSelect}, playlistSong.playlistId, playlistSong.songId, playlistSong.sequence
  ${songViewBaseJoins.replace('%songTable%', 'song')}
  INNER JOIN playlistSong
  ON song.id = playlistSong.songId
`})
export class SongExtendedByPlaylistViewEntity extends SongExtendedViewBaseEntity {
  @ViewColumn()
  playlistId: string;
  @ViewColumn()
  songId: string;
  @ViewColumn()
  sequence: number;
}

// SONG EXPORT TABLE
@ViewEntity({
  name: 'songExpExtendedView',
  expression: `
  ${songExtendedViewSelect} ${songViewBaseJoins.replace('%songTable%', 'songExport')}
`})
export class SongExpExtendedViewEntity extends SongExtendedViewBaseEntity {
}
@ViewEntity({
  name: 'songExpExtendedByArtistView',
  expression: `
  ${songExtendedViewSelect}, partyRelation.relatedId AS artistId
  ${songViewBaseJoins.replace('%songTable%', 'songExport')}
  INNER JOIN partyRelation
  ON song.id = partyRelation.songId
  WHERE partyRelation.relationTypeId = '${PartyRelationType.Primary}'
  OR partyRelation.relationTypeId = '${PartyRelationType.Featuring}'
`})
export class SongExpExtendedByArtistViewEntity extends SongExtendedViewBaseEntity {
  @ViewColumn()
  artistId: string;
}

@ViewEntity({
  name: 'songExpExtendedByClassificationView',
  expression: `
  ${songExtendedViewSelect}, songClassification.classificationId AS classificationId
  ${songViewBaseJoins.replace('%songTable%', 'songExport')}
  INNER JOIN songClassification
  ON song.id = songClassification.songId
`})
export class SongExpExtendedByClassificationViewEntity extends SongExtendedViewBaseEntity {
  @ViewColumn()
  classificationId: string;
}

@ViewEntity({
  name: 'songExpExtendedByPlaylistView',
  expression: `
  ${songExtendedViewSelect}, playlistSong.playlistId, playlistSong.songId, playlistSong.sequence
  ${songViewBaseJoins.replace('%songTable%', 'songExport')}
  INNER JOIN playlistSong
  ON song.id = playlistSong.songId
`})
export class SongExpExtendedByPlaylistViewEntity extends SongExtendedViewBaseEntity {
  @ViewColumn()
  playlistId: string;
  @ViewColumn()
  songId: string;
  @ViewColumn()
  sequence: number;
}