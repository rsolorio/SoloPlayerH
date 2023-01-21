import { Component, ComponentFactoryResolver, EventEmitter, Input, OnInit, Output, TemplateRef, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { INavbarModel, NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { DefaultImageSrc } from 'src/app/core/globals.enum';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IIconAction } from 'src/app/core/models/core.interface';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { FilterViewComponent } from 'src/app/filter/filter-view/filter-view.component';
import { IListItemModel } from '../../models/base-model.interface';
import { AppEvent } from '../../models/events.enum';
import { IListBroadcastService } from '../../models/list-broadcast-service-base.class';
import { IPaginationModel } from '../../models/pagination-model.interface';
import { BreadcrumbsStateService } from '../breadcrumbs/breadcrumbs-state.service';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { IListBaseModel } from './list-base-model.interface';

@Component({
  selector: 'sp-list-base',
  templateUrl: './list-base.component.html',
  styleUrls: ['./list-base.component.scss']
})
export class ListBaseComponent extends CoreComponent implements OnInit {
  @ViewChild('spModalHost', { read: ViewContainerRef, static: false }) public modalHostViewContainer: ViewContainerRef;
  public DefaultImageSrc = DefaultImageSrc;
  public model: IListBaseModel = {
    listUpdatedEvent: null,
    itemMenuList: [],
    paginationModel: {
      items: []
    },
    breadcrumbsEnabled: false
  };
  private lastNavbarDisplayMode = NavbarDisplayMode.None;
  private lastNavbarRightIcon: IIconAction;
  private filterWithCriteriaIcon = 'mdi-filter-check-outline mdi';
  private filterNoCriteriaIcon = 'mdi-filter-outline mdi';

  @Output() public itemRender: EventEmitter<IListItemModel> = new EventEmitter();
  @Output() public itemImageClick: EventEmitter<IListItemModel> = new EventEmitter();
  @Output() public itemContentClick: EventEmitter<IListItemModel> = new EventEmitter();
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

  @Input() set title(val: string) {
    this.model.title = val;
  }
  get title(): string {
    return this.model.title;
  }

  @Input() set leftIcon(val: string) {
    this.model.leftIcon = val;
  }
  get leftIcon(): string {
    return this.model.leftIcon;
  }

  @Input() set breadcrumbsEnabled(val: boolean) {
    this.model.breadcrumbsEnabled = val;
  }
  get breadcrumbsEnabled(): boolean {
    return this.model.breadcrumbsEnabled;
  }

  @Input() set broadcastService(val: IListBroadcastService) {
    this.model.broadcastService = val;
  }
  get broadcastService(): IListBroadcastService {
    return this.model.broadcastService;
  }

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private events: EventsService,
    private loadingService: LoadingViewStateService,
    private navbarService: NavBarStateService,
    private breadcrumbService: BreadcrumbsStateService
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

  public onIntersectionChange(isIntersecting: boolean, item: IListItemModel): void {
    if (item.canBeRendered !== isIntersecting) {
      item.canBeRendered = isIntersecting;
      if (item.canBeRendered) {
        this.itemRender.emit(item);
      }
    }
  }

  public onImageClick(item: IListItemModel): void {
    this.itemImageClick.emit(item);
  }

  public onContentClick(item: IListItemModel): void {
    this.itemContentClick.emit(item);
  }

  private afterListUpdated(): void {
    this.loadingService.hide();
    this.navbarService.showToast(`Found: ${this.model.paginationModel.items.length} item` + (this.model.paginationModel.items.length !== 1 ? 's' : ''));
  }

  private initializeNavbar(): void {
    // All list base components should have a search feature
    const navbar = this.navbarService.getState();
    navbar.show = true;
    // Title
    navbar.title = this.model.title;
    navbar.leftIcon = {
      icon: this.model.leftIcon
    };
    // Filter icon
    navbar.rightIcon = {
      icon: this.filterNoCriteriaIcon,
      action: () => {
        if (this.model.showModal) {
          this.model.showModal = false;
        }
        else {
          this.model.showModal = true;
          // We need time to allow the view child to render before trying to do anything with the container
          setTimeout(() => {
            this.loadModalFilter();
          });
        }
      }
    };

    // Search
    navbar.onSearch = searchTerm => {
      if (this.model.broadcastService) {
        this.loadingService.show();
        this.model.broadcastService.search(searchTerm, this.breadcrumbService.getCriteria()).subscribe();
      }
    };

    // By default, the clear will perform a search with no search value
    navbar.onSearchClear = () => {
      if (navbar.onSearch) {
        navbar.onSearch(navbar.searchTerm);
      }
    };

    // Determine component
    if (this.model.breadcrumbsEnabled) {
      navbar.componentType = this.breadcrumbService.hasBreadcrumbs() ? BreadcrumbsComponent : null;
      this.showComponent(navbar.componentType);
    }
    else {
      navbar.componentType = null;
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

  /**
   * Reloads the breadcrumbs component in order to show the latest data.
   */
  public showBreadcrumbs(): void {
    const navbar = this.navbarService.getState();
    if (navbar.componentType !== BreadcrumbsComponent || navbar.mode !== NavbarDisplayMode.Component) {
      this.showComponent(BreadcrumbsComponent);
    }
  }

  public showComponent(componentType: Type<any>): void {
    this.navbarService.loadComponent(componentType);
    this.navbarService.getState().mode = NavbarDisplayMode.Component;
  }

  public getSelectedItems():IListItemModel[] {
    return this.model.paginationModel.items.filter(item => item.selected);
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

  public getItemIcon(item: IListItemModel): string {
    let result: string = null;
    if (item.selected) {
      result = 'mdi-check mdi';
    }
    if (this.model.getBackdropIcon) {
      result = this.model.getBackdropIcon(item);
    }
    return result;
  }

  private loadModalFilter(): void {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(FilterViewComponent);
    this.modalHostViewContainer.createComponent(componentFactory);
  }
}
