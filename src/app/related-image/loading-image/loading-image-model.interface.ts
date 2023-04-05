import { IEventArgs } from 'src/app/core/models/core.interface';
import { RelatedImageEntity } from '../../shared/entities/related-image.entity';

export interface ILoadingImageModel {
    src: string;
    srcList?: string[];
    loadingDisabled: boolean;
    allowContextMenu: boolean;
    caretText?: string;
    stretch?: boolean;
    paletteEnabled?: boolean;
    images?: RelatedImageEntity[];
    selectedImageIndex: number;
    autoSize?: boolean;
}

export interface IImageLoadedEventArgs extends IEventArgs<any> {
    /** Determines if the color palette should be loaded after the image was loaded. */
    paletteEnabled: boolean;
}
