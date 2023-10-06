import { ViewColumn } from "typeorm";
import { IArtistModel } from "../models/artist-model.interface";
import { ListItemEntity } from "./base.entity";

export class ArtistViewBaseEntity extends ListItemEntity implements IArtistModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  hash: string;
  @ViewColumn()
  artistSort: string;
  @ViewColumn()
  artistStylized: string;
  @ViewColumn()
  artistType: string;  
  @ViewColumn()
  country: string;
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  albumCount: number;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  playCount: number;
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  songAddDateMax: Date;

  // These don't look like are needed in the view
  artistGender: string;
  vocal: boolean;
}