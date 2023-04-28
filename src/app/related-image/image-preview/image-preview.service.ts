import { Injectable } from '@angular/core';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';
import { IImagePreviewModel } from './image-preview-model.interface';
import { ImagePreviewComponent } from './image-preview.component';

@Injectable({
  providedIn: 'root'
})
export class ImagePreviewService {

  constructor(private sidebarHostService: SideBarHostStateService, private sidebarService: SideBarStateService) { }

  public show(model: IImagePreviewModel): void {
    this.sidebarHostService.loadComponent(ImagePreviewComponent, model);
    this.sidebarService.toggleRight();
  }
}