import { Column, Entity } from 'typeorm';
import { DbEntity } from './base.entity';

@Entity({name: 'relatedImage'})
export class RelatedImageEntity extends DbEntity {
  @Column()
  relatedId: string;
  @Column()
  sourcePath: string;
  @Column()
  sourceType: string;
  @Column()
  sourceIndex: number;
  @Column()
  imageType: string;
  @Column({ nullable: true })
  format: string;
  @Column({ nullable: true })
  colorSelection: string;
  @Column({ nullable: true })
  colorPalette: string;

  src: string;
}
