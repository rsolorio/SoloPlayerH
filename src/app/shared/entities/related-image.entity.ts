import { Column } from 'typeorm';
import { DbEntity } from './base.entity';

export class RelatedImageEntity extends DbEntity {
  @Column()
  relatedId: string;

  @Column()
  filePath: string;

  @Column()
  imageType: string;

  @Column()
  colorSelection: string;

  @Column()
  colorPalette: string;
}
