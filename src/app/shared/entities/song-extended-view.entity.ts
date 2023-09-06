import { ViewColumn, ViewEntity } from "typeorm";
import { SongViewBaseEntity } from "./song-view-base.entity";
import { ISongExtendedModel } from "../models/song-model.interface";

@ViewEntity({
  name: 'songExtendedView',
  expression: `
  
`
})
export class SongExtendedViewEntity extends SongViewBaseEntity implements ISongExtendedModel {
  @ViewColumn()
  externalId: string;
  @ViewColumn()
  titleSort: string;
  @ViewColumn()
  grouping: string;
  @ViewColumn()
  composer: string;
  @ViewColumn()
  composerSort: string;
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
  changeDate: Date;
  @ViewColumn()
  replaceDate: Date;
  @ViewColumn()
  primaryAlbumSort: string;
  @ViewColumn()
  primaryArtistSort: string;
  @ViewColumn()
  primaryArtistType: string;
  @ViewColumn()
  albumImage: string;
  @ViewColumn()
  albumSecondaryImage: string;
  @ViewColumn()
  albumArtistImage: string;
  @ViewColumn()
  singleImage: string;
}
