import { Column, Entity, OneToMany, Relation } from "typeorm";
import { IPlaylistModel } from "../models/playlist-model.interface";
import { ListEntity } from "./base.entity";
import { PlaylistSongEntity } from "./playlist-song.entity";

@Entity({name: 'playlist'})
export class PlaylistEntity extends ListEntity implements IPlaylistModel {
  @Column({ nullable: true })
  description: string;
  @Column()
  favorite: boolean;

  songCount: number;
  seconds: number;

  @OneToMany(type => PlaylistSongEntity, playlistSong => playlistSong.playlist)
  playlistSongs: Relation<PlaylistSongEntity[]>;
}
