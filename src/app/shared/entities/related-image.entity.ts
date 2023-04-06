import { Column, Entity } from 'typeorm';
import { DbEntity } from './base.entity';
import { IImage, IImageSource } from 'src/app/core/models/core.interface';
import { ImageSrcType } from 'src/app/core/globals.enum';

@Entity({name: 'relatedImage'})
export class RelatedImageEntity extends DbEntity implements IImage, IImageSource {
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
  mimeType: string;
  @Column({ nullable: true })
  colorSelection: string;
  @Column({ nullable: true })
  colorPalette: string;

  src: string;
  srcType: ImageSrcType;
}
