import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeViewComponent } from './home-view/home-view.component';
import { CoreModule } from '../core/core.module';



@NgModule({
  declarations: [
    HomeViewComponent
  ],
  imports: [
    CommonModule,
    CoreModule
  ]
})
export class HomeModule { }
