import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { SideBarHostStateService } from './side-bar-host-state.service';
import { ISideBarHostModel } from './side-bar-host-model.interface';
import { SideBarStateService } from '../side-bar/side-bar-state.service';
import { CoreComponent } from '../../models/core-component.class';
import { EventsService } from '../../services/events/events.service';
import { CoreEvent } from '../../services/events/events.enum';
import { ISideBarModel } from '../side-bar/side-bar-model.interface';
import { Position } from '../../models/core.enum';
import { IIconAction } from '../../models/core.interface';

/**
 * Component that hosts dynamic content for the side bar.
 */
@Component({
  selector: 'sp-side-bar-host',
  templateUrl: './side-bar-host.component.html',
  styleUrls: ['./side-bar-host.component.scss']
})
export class SideBarHostComponent extends CoreComponent implements OnInit {
  @ViewChild('spSidebarContentHost', { read: ViewContainerRef, static: true }) private sidebarContentViewContainer: ViewContainerRef;
  public model: ISideBarHostModel;
  constructor(
    private sidebarService: SideBarStateService,
    private sidebarHostService: SideBarHostStateService,
    private events: EventsService) {
    super();
  }

  ngOnInit(): void {
    this.model = this.sidebarHostService.getState();
    this.sidebarHostService.saveComponentContainer(this.sidebarContentViewContainer);
    // TODO: make sure no other process tries to open the panel when it is being closed
    this.subs.sink = this.events.onEvent<ISideBarModel>(CoreEvent.SidebarShow).subscribe(sidebarModel => {
      // Give the sidebar animation time to close the panel
      setTimeout(() => {
        // Clear the content of the host if the sidebar is being closed
        if (sidebarModel.position === Position.Right && !sidebarModel.show) {
          this.sidebarHostService.clearContent();
        }
      }, 1000);
    });
  }

  public onCancelClick(): void {
    // Before doing anything close the panel so the backdrop is immediately
    // removed and the hide animation starts
    this.sidebarService.hideRight();
    if (this.model.onCancel) {
      this.model.onCancel();
    }
  }

  public onOkClick(): void {
    // Before doing anything close the panel so the backdrop is immediately
    // removed and the hide animation starts
    this.sidebarService.hideRight();
    if (this.model.onOk) {
      const instanceModel = this.sidebarHostService.getInstanceModel();
      if (instanceModel) {
        this.model.onOk(instanceModel);
      }
      else {
        this.model.onOk(this.model);
      }
    }
  }

  public onActionClick(iconAction: IIconAction): void {
    if (iconAction.action) {
      iconAction.action(iconAction, this.sidebarHostService.getInstanceModel());
    }
  }
}
