import { BaseEntity, Column, PrimaryColumn, Entity } from 'typeorm';

@Entity({name: 'playlistSong'})
export class PlaylistSongEntity extends BaseEntity {
  @PrimaryColumn()
  playlistId: string;

  @PrimaryColumn()
  songId: string;

  @Column()
  sequence: number;
}
