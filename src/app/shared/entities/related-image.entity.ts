import { Column } from 'typeorm';
import { IdNameEntity } from './base.entity';

export class RelatedImageEntity extends IdNameEntity {
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
