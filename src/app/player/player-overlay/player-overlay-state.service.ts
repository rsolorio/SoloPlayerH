import { Injectable } from '@angular/core';
import { IStateService } from 'src/app/core/models/core.interface';
import { PlayerOverlayMode } from './player-overlay.enum';
import { IPlayerOverlayModel } from './player-overlay.interface';

@Injectable({
  providedIn: 'root'
})
export class PlayerOverlayStateService implements IStateService<IPlayerOverlayModel> {
  private state: IPlayerOverlayModel = {
    mode: PlayerOverlayMode.Small
  };

  private lastMode = PlayerOverlayMode.Small;

  constructor() { }

  public getState(): IPlayerOverlayModel {
    return this.state;
  }

  public expand(): void {
    this.lastMode = this.state.mode;
    this.state.mode = PlayerOverlayMode.Full;
  }

  public restore(): void {
    this.state.mode = this.lastMode;
  }

  public hide(): void {
    this.lastMode = this.state.mode;
    this.state.mode = PlayerOverlayMode.Hidden;
  }
}
