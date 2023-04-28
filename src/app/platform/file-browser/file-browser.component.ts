import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
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
import { Criteria } from 'src/app/shared/services/criteria/criteria.class';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';

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

  // START - LIST BASE

  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.FileListUpdated,
    itemMenuList: [
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
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    breadcrumbsEnabled: false,
    broadcastService: this.broadcastService,
    rightIcon: {
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
    },
    getDisplayInfo: model => {
      let itemsText = `${model.criteriaResult.items.length} item`;
      itemsText += model.criteriaResult.items.length === 1 ? '' : 's';
      const queryParams = this.getQueryParams();
      if (queryParams?.path) {
        return `${queryParams.path}  (${itemsText})`;
      }
      return itemsText;
    },
    prepareItemRender: item => {}
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
    const model = this.browserService.getState();
    if (!model.onOk || !model.backRoute) {
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
  }

  public onItemContentClick(fileItem: IFileBrowserItem): void {
    this.navigateFolder(fileItem.fileInfo);
  }

  public itemAvatarClick(fileItem: IFileBrowserItem): void {
    const model = this.browserService.getState();
    model.onOk([fileItem]).then(response => {
      if (response) {
        this.navigation.forward(model.backRoute);
      }
    });
  }

  public onAfterInit(listBaseModel: IListBaseModel): void {
    const navbarModel = this.navbarService.getState();
    navbarModel.menuList = [
      {
        caption: 'Select',
        icon: 'mdi-select mdi mdi',
        action: () => {
          const queryParams = this.getQueryParams();
          if (queryParams?.path) {
            this.fileService.getFileInfo(queryParams.path).then(fileInfo => {
              this.itemAvatarClick({ fileInfo: fileInfo, name: fileInfo.name, image: null, canBeRendered: false, id: null });
            });
          }
        }
      },
      {
        caption: 'Show Info',
        icon: 'mdi-folder-eye-outline mdi',
        action: () => {
          this.spListBaseComponent.showInfo();
        }
      },
      {
        caption: 'Cancel',
        icon: 'mdi-close-box-outline mdi',
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
}