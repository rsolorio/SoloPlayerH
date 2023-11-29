import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsViewComponent } from './settings-view/settings-view.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { CoreModule } from '../core/core.module';
import { DialogService } from '../platform/dialog/dialog.service';
import { DialogElectronService } from '../platform/dialog/dialog-electron.service';
import { DialogCordovaService } from '../platform/dialog/dialog-cordova.service';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    SettingsViewComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild([
      { path: 'settings/:viewId', component: SettingsViewComponent }
    ])
  ],
  providers: [ { provide: DialogService, useClass: DialogElectronService }]
})
export class SettingsModule { }
