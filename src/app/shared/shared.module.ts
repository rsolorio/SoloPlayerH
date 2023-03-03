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
import { FileService } from './services/file/file.service';
import { FileNodeService } from './services/file/file-node.service';
import { FileCordovaService } from './services/file/file-cordova.service';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { FilterModule } from '../filter/filter.module';
import { ChipSelectionComponent } from './components/chip-selection/chip-selection.component';
import { ResizeObserverDirective } from './directives/resize-observer/resize-observer.directive';
import { RatingComponent } from './components/rating/rating.component';
import { TextScrollerComponent } from './components/text-scroller/text-scroller.component';



@NgModule({
  declarations: [
    LoadingImageComponent,
    IntersectionObserverDirective,
    IntersectionObserverTargetDirective,
    QuickSearchComponent,
    ListBaseComponent,
    TransitionImageComponent,
    QuickFilterComponent,
    BreadcrumbsComponent,
    ChipSelectionComponent,
    ResizeObserverDirective,
    RatingComponent,
    TextScrollerComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    FilterModule
  ],
  exports: [
    ListBaseComponent,
    LoadingImageComponent,
    TransitionImageComponent,
    IntersectionObserverDirective,
    IntersectionObserverTargetDirective,
    ResizeObserverDirective,
    RatingComponent,
    TextScrollerComponent
  ],
  entryComponents: [ QuickSearchComponent ],
  providers: [ { provide: FileService, useClass: FileNodeService }]
})
export class SharedModule { }
