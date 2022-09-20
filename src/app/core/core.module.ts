import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// This will allow to use any other object from this module in the application
import { HttpClientModule } from '@angular/common/http';
import { SlideMenuModule } from 'primeng/slidemenu';

import { LoadingViewComponent } from './components/loading-view/loading-view.component';
import { DurationPipe } from './pipes/duration.pipe';
import { SortByPipe } from './pipes/sort-by.pipe';
import { IconMenuComponent } from './components/icon-menu/icon-menu.component';



@NgModule({
  declarations: [
    LoadingViewComponent,
    DurationPipe,
    SortByPipe,
    IconMenuComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    SlideMenuModule,
    FormsModule
  ]
})
export class CoreModule { }
