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
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { SideBarComponent } from './components/side-bar/side-bar.component';
import { SideBarMenuComponent } from './components/side-bar-menu/side-bar-menu.component';
import { ElectronService } from './services/electron/electron.service';
import { SideBarHostComponent } from './components/side-bar-host/side-bar-host.component';
import { ReadableDateTimePipe } from './pipes/readable-date-time.pipe';



@NgModule({
  declarations: [
    LoadingViewComponent,
    DurationPipe,
    SortByPipe,
    IconMenuComponent,
    NavBarComponent,
    SideBarComponent,
    SideBarMenuComponent,
    SideBarHostComponent,
    ReadableDateTimePipe
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    SlideMenuModule,
    FormsModule
  ],
  exports: [
    LoadingViewComponent,
    NavBarComponent,
    SideBarComponent,
    SideBarMenuComponent,
    IconMenuComponent,
    DurationPipe,
    SortByPipe,
    ReadableDateTimePipe,
    SideBarHostComponent
  ],
  providers: [ ElectronService ]
})
export class CoreModule { }
