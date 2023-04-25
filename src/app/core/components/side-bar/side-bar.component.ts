import { Component, OnInit, Input } from '@angular/core';
import { ISideBarModel } from './side-bar-model.interface';
import { Position } from '../../models/core.enum';
import { SideBarStateService } from './side-bar-state.service';

/**
 * Component that displays a sidebar from the left or right of the screen.
 * There can only be one sidebar per side. Each sidebar will have it own state/model.
 */
@Component({
  selector: 'sp-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit {
  @Input() set position(val: Position) {
    this.model = this.sidebarService.getState(val);
  }

  public model: ISideBarModel;

  constructor(private sidebarService: SideBarStateService) {
  }

  public ngOnInit(): void {
  }

}
