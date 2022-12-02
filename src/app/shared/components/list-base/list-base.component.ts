import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { INavbarModel, NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { DefaultImageSrc } from 'src/app/core/globals.enum';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IIconAction } from 'src/app/core/models/core.interface';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { IListModel } from '../../models/base-model.interface';
import { AppEvent } from '../../models/events.enum';
import { IPaginationModel } from '../../models/pagination-model.interface';
import { IListBaseModel } from './list-base-model.interface';

@Component({
  selector: 'sp-list-base',
  templateUrl: './list-base.component.html',
  styleUrls: ['./list-base.component.scss']
})
export class ListBaseComponent extends CoreComponent implements OnInit {
  public DefaultImageSrc = DefaultImageSrc;
  public model: IListBaseModel = {
    listUpdatedEvent: null,
    itemMenuList: [],
    paginationModel: {
      items: []
    },
    getBackdropIcon: () => null
  };
  private lastNavbarDisplayMode = NavbarDisplayMode.None;
  private lastNavbarRightIcon: IIconAction;
  private filterWithCriteriaIcon = 'mdi-filter-check-outline mdi';
  private filterNoCriteriaIcon = 'mdi-filter-outline mdi';

  @Output() public itemRender: EventEmitter<IListModel> = new EventEmitter();
  @Output() public itemImageClick: EventEmitter<IListModel> = new EventEmitter();
  @Output() public itemContentClick: EventEmitter<IListModel> = new EventEmitter();
  @Output() public initialized: EventEmitter<IListBaseModel> = new EventEmitter();

  @Input() infoTemplate: TemplateRef<any>;

  @Input() set listUpdatedEvent(val: string) {
    this.model.listUpdatedEvent = val;
  }
  get listUpdatedEvent(): string {
    return this.model.listUpdatedEvent;
  }

  @Input() set itemMenuList(val: IMenuModel[]) {
    this.model.itemMenuList = val;
  }
  get itemMenuList(): IMenuModel[] {
    return this.model.itemMenuList;
  }

  constructor(
    private events: EventsService,
    private loadingService: LoadingViewStateService,
    private navbarService: NavBarStateService
  ) {
    super();
  }

  ngOnInit(): void {
    // List updated
    this.subs.sink = this.events.onEvent<IPaginationModel<any>>(this.listUpdatedEvent).subscribe(response => {
      this.model.paginationModel = response;
      this.afterListUpdated();
    });

    this.subs.sink = this.events.onEvent<string>(AppEvent.CriteriaApplied).subscribe(response => {
      if (response === this.listUpdatedEvent) {
        const navbar = this.navbarService.getState();
        if (navbar.rightIcon && navbar.rightIcon.icon === this.filterNoCriteriaIcon) {
          navbar.rightIcon.icon = this.filterWithCriteriaIcon;
        }
        else if (this.lastNavbarRightIcon && this.lastNavbarRightIcon.icon === this.filterNoCriteriaIcon) {
          this.lastNavbarRightIcon.icon = this.filterWithCriteriaIcon;
        }
      }
    });

    this.subs.sink = this.events.onEvent<string>(AppEvent.CriteriaCleared).subscribe(response => {
      if (response === this.listUpdatedEvent) {
        const navbar = this.navbarService.getState();
        if (navbar.rightIcon && navbar.rightIcon.icon === this.filterWithCriteriaIcon) {
          navbar.rightIcon.icon = this.filterNoCriteriaIcon;
        }
        else if (this.lastNavbarRightIcon && this.lastNavbarRightIcon.icon === this.filterWithCriteriaIcon) {
          this.lastNavbarRightIcon.icon = this.filterNoCriteriaIcon;
        }
      }
    });

    this.initializeNavbar();
    this.initialized.emit(this.model);
  }

  public onIntersectionChange(isIntersecting: boolean, item: IListModel): void {
    if (item.canBeRendered !== isIntersecting) {
      item.canBeRendered = isIntersecting;
      if (item.canBeRendered) {
        this.itemRender.emit(item);
      }
    }
  }

  public onImageClick(item: IListModel): void {
    this.itemImageClick.emit(item);
  }

  public onContentClick(item: IListModel): void {
    this.itemContentClick.emit(item);
  }

  private afterListUpdated(): void {
    this.loadingService.hide();
    this.navbarService.showToast(`Found: ${this.model.paginationModel.items.length} item` + (this.model.paginationModel.items.length !== 1 ? 's' : ''));
  }

  private initializeNavbar(): void {
    // All list base components should have a search feature
    const navbar = this.navbarService.getState();
    navbar.rightIcon = {
      icon:this.filterNoCriteriaIcon,
    };

    // By default, the clear will perform a search with no search value
    navbar.onSearchClear = () => {
      if (navbar.onSearch) {
        navbar.onSearch(navbar.searchTerm);
      }
    };

    if (navbar.componentType) {
      this.navbarService.loadComponent(navbar.componentType);
      navbar.mode = NavbarDisplayMode.Component;
    }
    else if (navbar.title) {
      navbar.mode = NavbarDisplayMode.Title;
    }

    // Menu list
    navbar.menuList = [
      {
        caption: 'Search',
        icon: 'mdi-magnify mdi',
        action: () => {
          this.toggleSearch(navbar);
        }
      }
    ];
  }

  private toggleSearch(navbar: INavbarModel): void {
    if (navbar.mode === NavbarDisplayMode.Search) {
      navbar.mode = this.lastNavbarDisplayMode;
      navbar.rightIcon = this.lastNavbarRightIcon;
    }
    else {
      this.lastNavbarDisplayMode = navbar.mode;
      this.lastNavbarRightIcon = navbar.rightIcon;
      navbar.mode = NavbarDisplayMode.Search;
      // Notice we replace the whole right icon object with a new one
      navbar.rightIcon = {
        icon: 'mdi-magnify-remove-outline mdi',
        action: () => {
          this.toggleSearch(navbar);
        }
      };
      // Give the search box time to render before setting focus
      setTimeout(() => {
        this.navbarService.searchBoxFocus();
      });
    }
  }
}
