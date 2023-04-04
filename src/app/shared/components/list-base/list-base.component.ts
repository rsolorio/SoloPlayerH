import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppRoute } from 'src/app/app-routes';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { INavbarModel, NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IIcon, IIconAction } from 'src/app/core/models/core.interface';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IListItemModel } from '../../models/base-model.interface';
import { BreadcrumbEventType } from '../../models/breadcrumbs.enum';
import { AppEvent } from '../../models/events.enum';
import { IListBroadcastService } from '../../models/list-broadcast-service-base.class';
import { Criteria } from '../../services/criteria/criteria.class';
import { ICriteriaResult } from '../../services/criteria/criteria.interface';
import { RelatedImageSrc } from '../../services/database/database.images';
import { NavigationService } from '../../services/navigation/navigation.service';
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
  public RelatedImageSrc = RelatedImageSrc;
  public model: IListBaseModel = {
    listUpdatedEvent: null,
    itemMenuList: [],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
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
    private events: EventsService,
    private loadingService: LoadingViewStateService,
    private navbarService: NavBarStateService,
    private breadcrumbService: BreadcrumbsStateService,
    private navigation: NavigationService,
    private route: ActivatedRoute,
    private utilities: UtilityService
  ) {
    super();
  }

  ngOnInit(): void {
    // List updated
    this.subs.sink = this.events.onEvent<ICriteriaResult<any>>(this.listUpdatedEvent).subscribe(response => {
      this.model.criteriaResult = response;
      this.afterListUpdated();
    });

    // Breadcrumbs
    if (this.breadcrumbsEnabled) {
      this.subs.sink = this.events.onEvent<BreadcrumbEventType>(AppEvent.BreadcrumbUpdated).subscribe(response => {
        if (response === BreadcrumbEventType.Remove) {
          // Create a brand new criteria but with the same info by cloning the existing one
          const criteriaClone = this.model.criteriaResult.criteria.clone();
          // Since there was a breadcrumb update, set the new value also with a copy
          criteriaClone.breadcrumbCriteria = this.breadcrumbService.getCriteria().clone();
          // Navigate to the same route but with the new object
          this.navigation.forward(this.navigation.current().route, { criteria: criteriaClone });
        }
      });
    }

    // When navigating without changing the route, the component will not reload
    // However, we can detect if the query param changed
    this.subs.sink = this.route.queryParams.subscribe(() => {
      // Param changed, but not the route
      if (!this.navigation.routeChanged()) {
        this.loadData();
      }
    });

    this.initializeNavbar();
    this.initialized.emit(this.model);
    this.loadData();
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

  public onImageLoaded(): void {
    
  }

  private afterListUpdated(): void {
    this.updateFilterIcon();
    this.loadingService.hide();
    this.displayItemCount();
  }

  private updateFilterIcon(): void {
    const navbar = this.navbarService.getState();
    if (this.model.criteriaResult.criteria.hasComparison(true)) {
      // Display icon with criteria
      if (navbar.rightIcon && navbar.rightIcon.icon === this.filterNoCriteriaIcon) {
        navbar.rightIcon.icon = this.filterWithCriteriaIcon;
      }
      else if (this.lastNavbarRightIcon && this.lastNavbarRightIcon.icon === this.filterNoCriteriaIcon) {
        this.lastNavbarRightIcon.icon = this.filterWithCriteriaIcon;
      }
    }
    else {
      // Display icon without criteria
      if (navbar.rightIcon && navbar.rightIcon.icon === this.filterWithCriteriaIcon) {
        navbar.rightIcon.icon = this.filterNoCriteriaIcon;
      }
      else if (this.lastNavbarRightIcon && this.lastNavbarRightIcon.icon === this.filterWithCriteriaIcon) {
        this.lastNavbarRightIcon.icon = this.filterNoCriteriaIcon;
      }
    }
  }

  private initializeNavbar(): void {
    const routeInfo = this.utilities.getCurrentRouteInfo();
    // All list base components should have a search feature
    const navbar = this.navbarService.getState();
    navbar.show = true;
    // Title
    if (this.model.title) {
      navbar.title = this.model.title;
    }
    else if (routeInfo) {
      navbar.title = routeInfo.name;
    }

    if (this.model.leftIcon) {
      navbar.leftIcon = {
        icon: this.model.leftIcon
      };
    }
    else if (routeInfo) {
      navbar.leftIcon = {
        icon: routeInfo.icon
      };
    }
    
    // Filter icon
    navbar.rightIcon = {
      icon: this.filterNoCriteriaIcon,
      action: () => {
        this.navigation.forward(AppRoute.Queries, { routeParams: [this.model.criteriaResult.criteria.id] });
      }
    };

    // Search
    navbar.onSearch = searchTerm => {
      if (this.model.broadcastService) {
        this.loadingService.show();
        this.model.broadcastService.search(this.model.criteriaResult.criteria.clone(), searchTerm).subscribe();
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
      },
      {
        caption: 'Show Count',
        icon: 'mdi-counter mdi',
        action: () => {
          this.displayItemCount();
        }
      }
    ];
  }

  private displayItemCount(): void {
    this.navbarService.showToast(`Found: ${this.model.criteriaResult.items.length} item` + (this.model.criteriaResult.items.length !== 1 ? 's' : ''));
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
    return this.model.criteriaResult.items.filter(item => item.selected);
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

  /**
   * Prepares the query data in order to retrieve the results and send them via broadcast
   */
  public loadData(): void {
    // Show the animation here, it will be hidden by the broadcast service
    this.loadingService.show();
    // Use a copy of the last query in case the current navigation doesn't have a query
    const navInfo = this.navigation.current();
    navInfo.options = navInfo.options || {};
    if (!navInfo.options.criteria) {
      navInfo.options.criteria = this.model.criteriaResult.criteria.clone();
    }

    this.broadcastService.send(navInfo.options.criteria).subscribe(() => {
      // Enable title if no breadcrumbs
      if (!this.breadcrumbsEnabled || !this.breadcrumbService.hasBreadcrumbs()) {
        this.navbarService.getState().mode = NavbarDisplayMode.Title;
      }
    });
  }

  public getRecentIcon(days: number): IIcon {
    if (days < 31) {
      const tooltip = `Added ${days} days ago.`;
      if (days < 15) {
        if (days < 8) {
          if (days < 2) {
            if (days < 1) {
              return { styleClass: 'sp-color-orange', tooltip: 'Added today.' };
            }
            return { styleClass: 'sp-color-orange', tooltip: 'Added yesterday.' };
          }
          return { styleClass: 'sp-color-yellow', tooltip: tooltip };
        }
        return { styleClass: 'sp-color-green', tooltip: tooltip };
      }
      return { styleClass: 'sp-color-muted', tooltip: tooltip };
    }
    return { styleClass: 'sp-no-display' };
  }
}
