import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerOverlayComponent } from './player-overlay/player-overlay.component';
import { PlayerSmallComponent } from './player-small/player-small.component';
import { PlayerFullComponent } from './player-full/player-full.component';
import { CoreModule } from '../core/core.module';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [
    PlayerOverlayComponent,
    PlayerSmallComponent,
    PlayerFullComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    SharedModule
  ],
  exports: [ PlayerOverlayComponent ]
})
export class PlayerModule { }
