import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingImageComponent } from './components/loading-image/loading-image.component';
import { CoreModule } from '../core/core.module';



@NgModule({
  declarations: [
    LoadingImageComponent
  ],
  imports: [
    CommonModule,
    CoreModule
  ],
  exports: [
    LoadingImageComponent
  ]
})
export class SharedModule { }
