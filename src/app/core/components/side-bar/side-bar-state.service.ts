import { Injectable } from '@angular/core';
import { Position } from '../../models/core.enum';
import { ISideBarModel } from './side-bar-model.interface';
import { LoadingViewStateService } from '../loading-view/loading-view-state.service';
import { EventsService } from '../../services/events/events.service';
import { CoreEvent } from 'src/app/app-events';

@Injectable({
  providedIn: 'root'
})
export class SideBarStateService {

  private stateList: { [position: string]: ISideBarModel; } = { };

  constructor(private loadingViewService: LoadingViewStateService, private events: EventsService) { }

  public getState(position: Position): ISideBarModel {
    let sidebarState = this.stateList[position];
    if (!sidebarState) {
      sidebarState = {
        show: false,
        position
      };
      this.stateList[position] = sidebarState;
    }

    return sidebarState;
  }

  /** Toggles the specified sidebar. */
  public toggle(position: Position): void {
    const sidebarState = this.stateList[position];
    if (sidebarState) {
      this.setShowProperty(!sidebarState.show, position);
    }
  }

  /** Toggles the left sidebar. */
  public toggleLeft(): void {
    this.toggle(Position.Left);
  }

  /** Hides the left sidebar. */
  public hideLeft(): void {
    this.setShowProperty(false, Position.Left);
  }

  /** Hides the right sidebar. */
  public hideRight(): void {
    this.setShowProperty(false, Position.Right);
  }

  /** Toggles the right sidebar. */
  public toggleRight(): void {
    this.toggle(Position.Right);
  }

  /** Sets the show property of the specified sidebar. */
  public setShowProperty(show: boolean, position: Position): void {
    const sidebarState = this.stateList[position];
    if (sidebarState && sidebarState.show !== show) {
      sidebarState.show = show;
      if (sidebarState.show) {
        // Passing as an arrow function will allow to pass the proper context
        this.loadingViewService.dim(() => {
          if (position === Position.Left) {
            this.hideLeft();
          }
          else if (position === Position.Right) {
            this.hideRight();
          }
        });
      }
      else {
        this.loadingViewService.hide();
      }
      this.events.broadcast(CoreEvent.SidebarShow, sidebarState);
    }
  }
}
