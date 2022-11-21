import { Component, OnInit } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { PlayerOverlayStateService } from './player-overlay-state.service';
import { PlayerOverlayMode } from './player-overlay.enum';
import { IPlayerOverlayModel } from './player-overlay.interface';

@Component({
  selector: 'sp-player-overlay',
  templateUrl: './player-overlay.component.html',
  styleUrls: ['./player-overlay.component.scss']
})
export class PlayerOverlayComponent extends CoreComponent implements OnInit {

  public model: IPlayerOverlayModel;
  constructor(private playerOverlayService: PlayerOverlayStateService) {
    super();
  }

  ngOnInit(): void {
    this.model = this.playerOverlayService.getState();
  }

  public expand() {
    this.playerOverlayService.expand();
  }

  public restore() {
    this.playerOverlayService.restore();
  }

  public small() {
    this.playerOverlayService.getState().mode = PlayerOverlayMode.Small;
  }
}
