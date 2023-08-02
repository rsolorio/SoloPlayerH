import { Component } from '@angular/core';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IImagePreviewModel } from './image-preview-model.interface';

@Component({
  selector: 'sp-image-preview',
  templateUrl: './image-preview.component.html',
  styleUrls: ['./image-preview.component.scss']
})
export class ImagePreviewComponent {

  public model: IImagePreviewModel;

  constructor(private utility: UtilityService, private sidebarService: SideBarStateService) { }

  public onShareClick(): void {
    this.utility.shareImage(this.model.src);
    this.sidebarService.hideRight();
  }

  public onDownloadClick(): void {
    this.utility.downloadUrl(this.model.src);
    this.sidebarService.hideRight();
  }
}
