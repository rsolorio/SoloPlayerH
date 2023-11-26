import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { IFileBrowserItem, IFileBrowserModel, IFileBrowserQueryParams } from './file-browser.interface';
import { FileBrowserBroadcastService } from './file-browser-broadcast.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AppRoute } from 'src/app/app-routes';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { FileBrowserService } from './file-browser.service';
import { FileService } from '../file/file.service';
import { IFileInfo } from '../file/file.interface';
import { Criteria } from 'src/app/shared/services/criteria/criteria.class';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { AppActionIcons, AppAttributeIcons, getNumericBoxIcon } from 'src/app/app-icons';
import { AppEvent } from 'src/app/app-events';

@Component({
  selector: 'sp-file-browser',
  templateUrl: './file-browser.component.html',
  styleUrls: ['./file-browser.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileBrowserComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  /** Flag that indicates when the content is allowed to be rendered. */
  public contentEnabled = false;
  public AppAttributeIcons = AppAttributeIcons;
  private model: IFileBrowserModel;

  // START - LIST BASE
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.FileListUpdated,
    itemMenuList: [
      {
        caption: 'Details',
        icon: AppAttributeIcons.DirectoryInfo,
        action: (menuItem, param) => {
        }
      }
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    breadcrumbsEnabled: false,
    broadcastService: this.broadcastService,
    leftIcon: {
      offIcon: AppActionIcons.Back,
      offAction: () => {
        // Should we save?
        this.navigation.forward(this.model.backRoute);
      }
    },
    rightIcons: [
      {
        icon: AppActionIcons.LevelUp,
        action: async () => {
          const queryParams = this.getQueryParams();
          if (queryParams?.path) {
            const parentFileInfo = await this.fileService.getParentDir(queryParams.path);
            if (!parentFileInfo.hasError) {
              this.navigateFolder(parentFileInfo);
            }
          }
        }
      },
      {
        icon: AppActionIcons.Ok,
        action: () => {
          const browserModel = this.browserService.getState();
          browserModel.onOk(browserModel).then(response => {
            if (response) {
              this.navigation.forward(browserModel.backRoute);
            }
          });
        }
      },
      {
        icon: AppAttributeIcons.Unselected,
        action: () => {
          // TODO: display a panel with all selected paths and ability to delete them
        }
      }
    ],
    getDisplayInfo: model => {
      let itemsText = `${model.criteriaResult.items.length} item`;
      itemsText += model.criteriaResult.items.length === 1 ? '' : 's';
      const queryParams = this.getQueryParams();
      if (queryParams?.path) {
        return `${queryParams.path}  (${itemsText})`;
      }
      return itemsText;
    }
  };
  // END - LIST BASE

  constructor(
    public broadcastService: FileBrowserBroadcastService,
    private navigation: NavigationService,
    private navbarService: NavBarStateService,
    private browserService: FileBrowserService,
    private fileService: FileService
  ) { }

  ngOnInit(): void {
    this.model = this.browserService.getState();
    if (!this.model.onOk || !this.model.backRoute) {
      // Send to home if this doesn't have the proper configuration
      this.navigation.forward(AppRoute.Home);
    }
    else {
      this.contentEnabled = true;
    }

    const queryParams = this.getQueryParams();
    if (queryParams?.name) {
      this.listModel.title = queryParams.name;
    }
    else {
      this.listModel.title = '[Root]';
    }
    this.updateSelectionCount();
  }

  public onItemContentClick(fileItem: IFileBrowserItem): void {
    this.navigateFolder(fileItem.fileInfo);
  }

  public itemAvatarClick(fileItem: IFileBrowserItem): void {
    this.navigateFolder(fileItem.fileInfo);
  }

  public onSelectClick(e: Event, fileItem: IFileBrowserItem): void {
    e.stopImmediatePropagation();
    fileItem.selected = !fileItem.selected;
    if (fileItem.selected) {
      this.model.selectedItems = this.model.selectedItems ? this.model.selectedItems : [];
      this.model.selectedItems.push(fileItem);
    }
    else {
      this.model.selectedItems = this.model.selectedItems.filter(i => i.id !== fileItem.id);
    }
    this.updateSelectionCount();
  }

  public onAfterInit(listBaseModel: IListBaseModel): void {
    const navbarModel = this.navbarService.getState();
    navbarModel.menuList = [
      {
        caption: 'Details',
        icon: AppAttributeIcons.DirectoryInfo,
        action: () => {
          this.spListBaseComponent.showInfo();
        }
      },
      {
        caption: 'Clear Selection',
        icon: AppAttributeIcons.Unselected,
        action: () => {}
      },
      {
        caption: 'Cancel',
        icon: AppActionIcons.CloseClear,
        action: () => {
          const model = this.browserService.getState();
          if (model.onCancel) {
            model.onCancel().then(response => {
              if (response) {
                this.navigation.forward(model.backRoute);
              }
            });
          }
          else {
            this.navigation.forward(model.backRoute);
          }
        }
      }
    ];
  }

  public onListUpdated(listModel: IListBaseModel): void {
    listModel.criteriaResult.items.forEach(listItem => {
      const selectedItem = this.model.selectedItems.find(i => i.id === listItem.id);
      if (selectedItem) {
        listItem.selected = true;
      }
    });
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

  private updateSelectionCount(): void {
    if (this.model.selectedItems.length) {
      this.listModel.rightIcons[2].icon = getNumericBoxIcon(this.model.selectedItems.length);
    }
    else {
      this.listModel.rightIcons[2].icon = AppAttributeIcons.Unselected;
    }
  }
}
