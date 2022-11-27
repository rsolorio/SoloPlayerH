import { Injectable } from '@angular/core';
import { Position } from '../../globals.enum';
import { ISideBarModel } from './side-bar-model.interface';
import { LoadingViewStateService } from '../loading-view/loading-view-state.service';

@Injectable({
  providedIn: 'root'
})
export class SideBarStateService {

  private stateList: { [position: string]: ISideBarModel; } = { };

  constructor(private loadingViewService: LoadingViewStateService) { }

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

  public toggle(position: Position): void {
    const sidebarState = this.stateList[position];
    if (sidebarState) {
      this.setShowProperty(!sidebarState.show, position);
    }
  }

  public toggleLeft(): void {
    this.toggle(Position.Left);
  }

  public hideLeft(): void {
    this.setShowProperty(false, Position.Left);
  }

  public hideRight(): void {
    this.setShowProperty(false, Position.Right);
  }

  public toggleRight(): void {
    this.toggle(Position.Right);
  }

  public setShowProperty(show: boolean, position: Position): void {
    const sidebarState = this.stateList[position];
    if (sidebarState) {
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
    }
  }
}
