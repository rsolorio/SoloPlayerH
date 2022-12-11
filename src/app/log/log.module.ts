import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogViewComponent } from './log-view/log-view.component';
import { CoreModule } from '../core/core.module';


@NgModule({
  declarations: [
    LogViewComponent
  ],
  imports: [
    CommonModule,
    CoreModule
  ]
})
export class LogModule { }
