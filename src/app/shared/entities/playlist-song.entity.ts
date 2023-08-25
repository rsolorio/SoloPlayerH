import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({name: 'playlistSong'})
export class PlaylistSongEntity extends BaseEntity {
  @PrimaryColumn()
  playlistId: string;

  @PrimaryColumn()
  songId: string;

  @Column()
  sequence: number;
}
