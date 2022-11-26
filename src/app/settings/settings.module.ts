import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsViewComponent } from './settings-view/settings-view.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { CoreModule } from '../core/core.module';



@NgModule({
  declarations: [
    SettingsViewComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    SharedModule
  ]
})
export class SettingsModule { }
