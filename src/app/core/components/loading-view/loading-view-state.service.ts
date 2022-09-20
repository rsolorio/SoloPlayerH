import { Injectable } from '@angular/core';
import { ILoadingViewModel } from './loading-view-model.interface';

@Injectable({
  providedIn: 'root'
})
export class LoadingViewStateService {

  private loadingViewState: ILoadingViewModel = {
    visible: false,
    loadingClass: '',
    onClick: () => {}
  };

  constructor() { }

  public getState(): ILoadingViewModel {
    return this.loadingViewState;
  }

  public show(): void {
    if (!this.loadingViewState.visible) {
      // TODO: disable user input
      this.loadingViewState.visible = true;
      // Activate animations by adding the class
      this.loadingViewState.loadingClass = 'sp-circular-loader';
    }
  }

  public hide(): void {
    this.loadingViewState.visible = false;
    this.loadingViewState.loadingClass = '';
    this.loadingViewState.onClick = () => {};
  }

  /**
   * Displays a dim overlay in the application.
   * If the user clicks on the overlay the dim will disappear.
   * @param onClickFn Action to be fired if the user clicks the dim area.
   */
  public dim(onClickFn: () => void): void {
    if (!this.loadingViewState.visible) {
      this.loadingViewState.visible = true;
    }
    // Display the dim without the loading animation
    this.loadingViewState.loadingClass = '';
    this.loadingViewState.onClick = onClickFn;
  }
}
