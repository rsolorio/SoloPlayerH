import { Entity } from 'typeorm';
import { DbEntity } from './base.entity';

/**
 * OBSOLETE. Using classification entity.
 */
@Entity({name: 'genre'})
export class GenreEntity extends DbEntity {
}
