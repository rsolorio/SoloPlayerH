import { BaseEntity, Column, Entity, ManyToOne, JoinColumn, Relation, PrimaryColumn } from 'typeorm';
import { PlaylistEntity } from './playlist.entity';
import { SongEntity } from './song.entity';
import { IPlaylistSongModel } from '../models/playlist-song-model.interface';
import { ITransitionImageModel } from 'src/app/related-image/transition-image/transition-image-model.interface';
import { RelatedImageSrc } from '../services/database/database.seed';

@Entity({name: 'playlistSong'})
export class PlaylistSongEntity extends BaseEntity implements IPlaylistSongModel {
  @PrimaryColumn()
  playlistId: string;

  @PrimaryColumn()
  songId: string;

  @Column()
  sequence: number;

  @ManyToOne(() => PlaylistEntity, playlist => playlist.playlistSongs)
  @JoinColumn({ name: 'playlistId'})
  playlist: Relation<PlaylistEntity>;

  @ManyToOne(() => SongEntity, song => song.playlistSongs)
  @JoinColumn({ name: 'songId'})
  song: Relation<SongEntity>;

  // Properties to comply with the list model
  id: string;
  name: string;
  canBeRendered: boolean;
  image: ITransitionImageModel = {
    defaultSrc: RelatedImageSrc.DefaultSmall
  };
}
