import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsViewComponent } from './settings-view/settings-view.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { CoreModule } from '../core/core.module';
import { DialogService } from '../shared/services/dialog/dialog.service';
import { DialogElectronService } from '../shared/services/dialog/dialog-electron.service';
import { DialogCordovaService } from '../shared/services/dialog/dialog-cordova.service';



@NgModule({
  declarations: [
    SettingsViewComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    SharedModule
  ],
  providers: [ { provide: DialogService, useClass: DialogElectronService }]
})
export class SettingsModule { }
