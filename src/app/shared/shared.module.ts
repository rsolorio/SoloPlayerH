import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingImageComponent } from './components/loading-image/loading-image.component';
import { CoreModule } from '../core/core.module';
import { IntersectionObserverDirective } from './directives/intersection-observer/intersection-observer.directive';
import { IntersectionObserverTargetDirective } from './directives/intersection-observer/intersection-observer-target.directive';
import { QuickSearchComponent } from './components/quick-search/quick-search.component';
import { FormsModule } from '@angular/forms';
import { ListBaseComponent } from './components/list-base/list-base.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TransitionImageComponent } from './components/transition-image/transition-image.component';
import { QuickFilterComponent } from './components/quick-filter/quick-filter.component';



@NgModule({
  declarations: [
    LoadingImageComponent,
    IntersectionObserverDirective,
    IntersectionObserverTargetDirective,
    QuickSearchComponent,
    ListBaseComponent,
    TransitionImageComponent,
    QuickFilterComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule
  ],
  exports: [
    ListBaseComponent,
    LoadingImageComponent,
    TransitionImageComponent,
    IntersectionObserverDirective,
    IntersectionObserverTargetDirective
  ],
  entryComponents: [ QuickSearchComponent ]
})
export class SharedModule { }
