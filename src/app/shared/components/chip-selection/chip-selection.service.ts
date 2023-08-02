import { Injectable } from '@angular/core';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';
import { IChipSelectionModel } from './chip-selection-model.interface';
import { ChipSelectionComponent } from './chip-selection.component';

/**
 * OBSOLETE.
 */
@Injectable({
  providedIn: 'root'
})
export class ChipSelectionService {

  constructor(private sidebarHostService: SideBarHostStateService, private sidebarService: SideBarStateService) { }

  public showInPanel(model: IChipSelectionModel): void {
    //this.sidebarHostService.loadComponent(ChipSelectionComponent, model);
    this.sidebarService.toggleRight();
  }
}
