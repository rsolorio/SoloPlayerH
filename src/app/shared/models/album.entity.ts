import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'album'})
export class AlbumEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  primaryArtistId: string;

  @Column()
  albumType: string;

  @Column()
  releaseYear: number;

  @Column()
  favorite: boolean;
}
