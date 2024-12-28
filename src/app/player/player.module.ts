import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerOverlayComponent } from './player-overlay/player-overlay.component';
import { PlayerSmallComponent } from './player-small/player-small.component';
import { PlayerFullComponent } from './player-full/player-full.component';
import { CoreModule } from '../core/core.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { PlaylistModule } from '../playlist/playlist.module';
import { PlayerQuizComponent } from './player-quiz/player-quiz.component';



@NgModule({
  declarations: [
    PlayerOverlayComponent,
    PlayerSmallComponent,
    PlayerFullComponent,
    PlayerQuizComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    SharedModule,
    PlaylistModule
  ],
  exports: [ PlayerOverlayComponent ]
})
export class PlayerModule { }
