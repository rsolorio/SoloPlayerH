import { BaseEntity, Column, PrimaryColumn, Entity } from 'typeorm';
import { SongEntity } from './song.entity';

@Entity({name: 'playlistSong'})
export class PlaylistSongEntity extends BaseEntity {
  @PrimaryColumn()
  playlistId: string;

  @PrimaryColumn()
  songId: string;

  @Column()
  sequence: number;

  song?: SongEntity;
}
