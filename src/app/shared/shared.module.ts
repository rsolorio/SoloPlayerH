import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingImageComponent } from './components/loading-image/loading-image.component';
import { CoreModule } from '../core/core.module';
import { IntersectionObserverDirective } from './directives/intersection-observer/intersection-observer.directive';
import { IntersectionObserverTargetDirective } from './directives/intersection-observer/intersection-observer-target.directive';



@NgModule({
  declarations: [
    LoadingImageComponent,
    IntersectionObserverDirective,
    IntersectionObserverTargetDirective
  ],
  imports: [
    CommonModule,
    CoreModule
  ],
  exports: [
    LoadingImageComponent,
    IntersectionObserverDirective,
    IntersectionObserverTargetDirective
  ]
})
export class SharedModule { }
