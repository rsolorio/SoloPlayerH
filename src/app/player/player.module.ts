import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerOverlayComponent } from './player-overlay/player-overlay.component';



@NgModule({
  declarations: [
    PlayerOverlayComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [ PlayerOverlayComponent ]
})
export class PlayerModule { }
