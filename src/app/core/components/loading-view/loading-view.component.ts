import { Component, OnInit } from '@angular/core';
import { ILoadingViewModel } from './loading-view-model.interface';
import { LoadingViewStateService } from './loading-view-state.service';

@Component({
  selector: 'sp-loading-view',
  templateUrl: './loading-view.component.html',
  styleUrls: ['./loading-view.component.scss']
})
export class LoadingViewComponent implements OnInit {

  public model: ILoadingViewModel;

  constructor(private loadingViewService: LoadingViewStateService) {
    this.model = this.loadingViewService.getState();
  }

  ngOnInit(): void {
  }

  public onClick(): void {
    this.model.onClick();
  }
}
