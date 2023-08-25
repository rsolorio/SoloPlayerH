import { Column, Entity } from "typeorm";
import { IPlaylistModel } from "../models/playlist-model.interface";
import { ListItemEntity } from "./base.entity";

@Entity({name: 'playlist'})
export class PlaylistEntity extends ListItemEntity implements IPlaylistModel {
  @Column({ nullable: true })
  description: string;
  @Column()
  favorite: boolean;
  @Column()
  imported: boolean;
  @Column()
  groupId: string;
  @Column()
  changeDate: Date;

  songCount: number;
  seconds: number;
}
