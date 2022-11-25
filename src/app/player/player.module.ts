import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerOverlayComponent } from './player-overlay/player-overlay.component';
import { PlayerSmallComponent } from './player-small/player-small.component';
import { PlayerFullComponent } from './player-full/player-full.component';



@NgModule({
  declarations: [
    PlayerOverlayComponent,
    PlayerSmallComponent,
    PlayerFullComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [ PlayerOverlayComponent ]
})
export class PlayerModule { }
