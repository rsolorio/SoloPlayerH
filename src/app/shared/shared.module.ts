import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../core/core.module';
import { IntersectionObserverDirective } from './directives/intersection-observer/intersection-observer.directive';
import { IntersectionObserverTargetDirective } from './directives/intersection-observer/intersection-observer-target.directive';
import { QuickSearchComponent } from './components/quick-search/quick-search.component';
import { FormsModule } from '@angular/forms';
import { ListBaseComponent } from './components/list-base/list-base.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { QuickFilterComponent } from './components/quick-filter/quick-filter.component';
import { FileService } from '../platform/file/file.service';
import { FileElectronService } from '../platform/file/file-electron.service';
import { FileCordovaService } from '../platform/file/file-cordova.service';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { ChipSelectionComponent } from './components/chip-selection/chip-selection.component';
import { ResizeObserverDirective } from './directives/resize-observer/resize-observer.directive';
import { RatingComponent } from './components/rating/rating.component';
import { TextScrollerComponent } from './components/text-scroller/text-scroller.component';
import { RelatedImageModule } from '../related-image/related-image.module';
import { ImageService } from '../platform/image/image.service';
import { ImageElectronService } from '../platform/image/image-electron.service';
import { EyeDropperDirective } from './directives/eye-dropper/eye-dropper.directive';
import { EntityEditorComponent } from './components/entity-editor/entity-editor.component';
import { SettingsBaseComponent } from './components/settings-base/settings-base.component';



@NgModule({
  declarations: [
    IntersectionObserverDirective,
    IntersectionObserverTargetDirective,
    QuickSearchComponent,
    ListBaseComponent,
    QuickFilterComponent,
    BreadcrumbsComponent,
    ChipSelectionComponent,
    ResizeObserverDirective,
    RatingComponent,
    TextScrollerComponent,
    EyeDropperDirective,
    EntityEditorComponent,
    SettingsBaseComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    RelatedImageModule
  ],
  exports: [
    ListBaseComponent,
    IntersectionObserverDirective,
    IntersectionObserverTargetDirective,
    ResizeObserverDirective,
    RatingComponent,
    TextScrollerComponent,
    EyeDropperDirective,
    EntityEditorComponent,
    SettingsBaseComponent
  ],
  entryComponents: [ QuickSearchComponent ],
  providers: [ { provide: FileService, useClass: FileElectronService }, { provide: ImageService, useClass: ImageElectronService } ]
})
export class SharedModule { }
