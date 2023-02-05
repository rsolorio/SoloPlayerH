import { Injectable } from '@angular/core';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';
import { IStateService } from 'src/app/core/models/core.interface';
import { IChipSelectionModel } from './chip-selection-model.interface';
import { ChipSelectionComponent } from './chip-selection.component';

@Injectable({
  providedIn: 'root'
})
export class ChipSelectionService implements IStateService<IChipSelectionModel> {

  private state: IChipSelectionModel;
  constructor(private sidebarHostService: SideBarHostStateService, private sidebarService: SideBarStateService) { }

  public getState(): IChipSelectionModel {
    return this.state;
  }

  public showInPanel(model: IChipSelectionModel): void {
    this.state = model;
    this.sidebarHostService.loadComponent(ChipSelectionComponent);
    this.sidebarService.toggleRight();
  }
}
