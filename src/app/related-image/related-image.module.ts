import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingImageComponent } from './loading-image/loading-image.component';
import { TransitionImageComponent } from './transition-image/transition-image.component';
import { ImagePreviewComponent } from './image-preview/image-preview.component';



@NgModule({
  declarations: [
    LoadingImageComponent,
    TransitionImageComponent,
    ImagePreviewComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    LoadingImageComponent,
    TransitionImageComponent
  ]
})
export class RelatedImageModule { }
