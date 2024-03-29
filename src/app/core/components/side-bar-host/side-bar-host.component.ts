import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { SideBarHostStateService } from './side-bar-host-state.service';
import { ISideBarHostModel } from './side-bar-host-model.interface';
import { CoreComponent } from '../../models/core-component.class';
import { EventsService } from '../../services/events/events.service';
import { ISideBarModel } from '../side-bar/side-bar-model.interface';
import { Position } from '../../models/core.enum';
import { IIconAction } from '../../models/core.interface';
import { CoreEvent } from 'src/app/app-events';

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
    this.sidebarHostService.closeCancel();
  }

  public onOkClick(): void {
    this.sidebarHostService.closeOk();
  }

  public onActionClick(iconAction: IIconAction): void {
    if (iconAction.action) {
      iconAction.action(iconAction, this.sidebarHostService.getInstanceModel());
    }
  }
}
