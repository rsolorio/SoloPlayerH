import { Entity } from 'typeorm';
import { DbEntity } from './base.entity';

@Entity({name: 'genre'})
export class GenreEntity extends DbEntity {
}
