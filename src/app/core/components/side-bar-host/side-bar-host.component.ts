import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { SideBarHostStateService } from './side-bar-host-state.service';
import { ISideBarHostModel } from './side-bar-host-model.interface';
import { SideBarStateService } from '../side-bar/side-bar-state.service';

/**
 * Component that hosts dynamic content for the side bar.
 */
@Component({
  selector: 'sp-side-bar-host',
  templateUrl: './side-bar-host.component.html',
  styleUrls: ['./side-bar-host.component.scss']
})
export class SideBarHostComponent implements OnInit {
  @ViewChild('spSidebarContentHost', { read: ViewContainerRef, static: true }) private sidebarContentViewContainer: ViewContainerRef;
  public model: ISideBarHostModel;
  constructor(private sidebarService: SideBarStateService, private sidebarHostService: SideBarHostStateService) { }

  ngOnInit(): void {
    this.model = this.sidebarHostService.getState();
    this.sidebarHostService.saveComponentContainer(this.sidebarContentViewContainer);
  }

  public onCancelClick(): void {
    if (this.model.onCancel) {
      this.model.onCancel();
    }
    this.sidebarService.hideRight();
  }

  public onOkClick(): void {
    if (this.model.onOk) {
      const instanceModel = this.sidebarHostService.getInstanceModel();
      if (instanceModel) {
        this.model.onOk(instanceModel);
      }
      else {
        this.model.onOk(this.model);
      }
    }
    this.sidebarService.hideRight();
  }
}
