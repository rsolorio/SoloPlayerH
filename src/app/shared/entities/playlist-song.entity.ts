import { BaseEntity, Column, Entity, ManyToOne, JoinColumn, Relation, PrimaryColumn } from 'typeorm';
import { PlaylistEntity } from './playlist.entity';
import { SongEntity } from './song.entity';

@Entity({name: 'playlistSong'})
export class PlaylistSongEntity extends BaseEntity {
  @PrimaryColumn()
  playlistId: string;

  @PrimaryColumn()
  songId: string;

  @Column()
  sequence: number;

  @ManyToOne(type => PlaylistEntity, playlist => playlist.playlistSongs)
  @JoinColumn({ name: 'playlistId'})
  playlist: Relation<PlaylistEntity>;

  @ManyToOne(type => SongEntity, song => song.playlistSongs)
  @JoinColumn({ name: 'songId'})
  song: Relation<SongEntity>;
}
