import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { SideBarHostStateService } from './side-bar-host-state.service';

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
  constructor(private sidebarHostService: SideBarHostStateService) { }

  ngOnInit(): void {
    this.sidebarHostService.saveComponentContainer(this.sidebarContentViewContainer);
  }
}
