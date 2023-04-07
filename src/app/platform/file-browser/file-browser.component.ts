import { Component, OnInit } from '@angular/core';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IFileBrowserItem, IFileBrowserQueryParams } from './file-browser.interface';
import { FileBrowserBroadcastService } from './file-browser-broadcast.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AppRoute } from 'src/app/app-routes';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { FileBrowserService } from './file-browser.service';
import { FileService } from '../file/file.service';
import { IFileInfo } from '../file/file.interface';

@Component({
  selector: 'sp-file-browser',
  templateUrl: './file-browser.component.html',
  styleUrls: ['./file-browser.component.scss']
})
export class FileBrowserComponent implements OnInit {
  public AppEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];
  constructor(
    public broadcastService: FileBrowserBroadcastService,
    private navigation: NavigationService,
    private navbarService: NavBarStateService,
    private browserService: FileBrowserService,
    private fileService: FileService
  ) { }

  ngOnInit(): void {
  }

  public onItemContentClick(fileItem: IFileBrowserItem): void {
    this.navigateFolder(fileItem.fileInfo);
  }

  public itemAvatarClick(fileItem: IFileBrowserItem): void {
    // Select and return
    const model = this.browserService.getState();
    if (model.onOk) {
      model.onOk([fileItem]);
    }
  }

  public onBeforeInit(listBaseModel: IListBaseModel): void {
    const queryParams = this.getQueryParams();
    if (queryParams?.name) {
      listBaseModel.title = queryParams.name;
    }
    else {
      listBaseModel.title = '[Root]';
    }
    listBaseModel.getItemIcon = item => {
      // TODO: determine the proper icon
      // const fileItem = item as IFileBrowserItem;
      return {
        icon: 'mdi-folder mdi',
        action: () => {}
      };
    };
    listBaseModel.rightIcon = {
      icon: 'mdi-arrow-up-right-bold mdi',
      action: async () => {
        const queryParams = this.getQueryParams();
        if (queryParams?.path) {
          const parentFileInfo = await this.fileService.getParentDir(queryParams.path);
          if (!parentFileInfo.hasError) {
            this.navigateFolder(parentFileInfo);
          }
        }
      }
    };
    listBaseModel.itemMenuList = [
      {
        caption: 'Select',
        icon: 'mdi-select mdi mdi',
        action: param => {
          const fileItem = param as IFileBrowserItem;
          if (fileItem) {
            this.itemAvatarClick(fileItem);
          }
        }
      }
    ];
    listBaseModel.onInfoDisplay = model => {
      this.showInfo(model);
    };
  }

  public onAfterInit(listBaseModel: IListBaseModel): void {
    const navbarModel = this.navbarService.getState();
    navbarModel.menuList = [
      {
        caption: 'Select',
        icon: 'mdi-select mdi mdi',
        action: () => {}
      },
      {
        caption: 'Show Info',
        icon: 'mdi-folder-eye-outline mdi',
        action: () => {
          this.showInfo(listBaseModel);
        }
      },
      {
        caption: 'Cancel',
        icon: 'mdi-close-box-outline mdi'
      }
    ];
  }

  private getQueryParams(): IFileBrowserQueryParams {
    const current = this.navigation.current();
    if (current.options?.queryParams) {
      return current.options.queryParams;
    }
    return null;
  }

  private navigateFolder(fileInfo: IFileInfo): void {
    const queryParams: IFileBrowserQueryParams = {
      path: fileInfo.path,
      name: fileInfo.name
    };
    this.navigation.forward(AppRoute.Files, {
      queryParams: queryParams
    });
    // The previous routine will stay in the same route, but we need to make sure the title is updated
    this.navbarService.getState().title = fileInfo.name;
  }

  private showInfo(model: IListBaseModel): void {
    let itemsText = `${model.criteriaResult.items.length} item`;
    itemsText += model.criteriaResult.items.length === 1 ? '' : 's';
    const queryParams = this.getQueryParams();
    if (queryParams?.path) {
      this.navbarService.showToast(`${queryParams.path}  (${itemsText})`);
    }
    else {
      this.navbarService.showToast(itemsText);
    } 
  }
}
