import { Injectable } from '@angular/core';
import { IIcon, IStateService } from 'src/app/core/models/core.interface';
import { PlayerOverlayMode } from './player-overlay.enum';
import { IPlayerOverlayModel } from './player-overlay.interface';
import { TimeAgo } from 'src/app/core/globals.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerOverlayStateService implements IStateService<IPlayerOverlayModel> {
  private state: IPlayerOverlayModel = {
    mode: PlayerOverlayMode.Small
  };

  private lastMode = PlayerOverlayMode.Small;

  constructor(private utility: UtilityService) { }

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

  public getPopularityIcon(days: number): IIcon {
    // TODO: this should be located on a music service
    const timeAgo = this.utility.getTimeAgo(days);
    const icon = 'mdi-fire mdi';
    if (timeAgo === TimeAgo.Today) {
      return { icon: icon, styleClass: 'sp-color-red', tooltip: 'Played today.' };
    }
    if (timeAgo === TimeAgo.Yesterday) {
      return { icon: icon, styleClass: 'sp-color-orange', tooltip: 'Played yesterday.' };
    }
    const tooltip = `Played ${days} days ago.`;
    if (timeAgo === TimeAgo.OneWeek) {
      return { icon: icon, styleClass: 'sp-color-yellow', tooltip: tooltip };
    }
    if (timeAgo === TimeAgo.TwoWeeks) {
      return { icon: icon, styleClass: 'sp-color-normal-text', tooltip: tooltip };
    }
    if (timeAgo === TimeAgo.OneMonth) {
      return { icon: icon, styleClass: 'sp-color-muted', tooltip: tooltip };
    }
    return { icon: icon, styleClass: 'sp-no-display' };
  }
}
