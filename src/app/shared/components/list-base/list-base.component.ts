import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  Type,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppRoute } from 'src/app/app-routes';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { INavbarModel, NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IIcon, IIconAction } from 'src/app/core/models/core.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IListItemModel } from '../../models/base-model.interface';
import { BreadcrumbEventType } from '../../models/breadcrumbs.enum';
import { AppEvent } from '../../models/events.enum';
import { Criteria } from '../../services/criteria/criteria.class';
import { ICriteriaResult } from '../../services/criteria/criteria.interface';
import { NavigationService } from '../../services/navigation/navigation.service';
import { BreadcrumbsStateService } from '../breadcrumbs/breadcrumbs-state.service';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { IListBaseModel } from './list-base-model.interface';
import { TimeAgo } from 'src/app/core/models/core.enum';
import { LogService } from 'src/app/core/services/log/log.service';

@Component({
  selector: 'sp-list-base',
  templateUrl: './list-base.component.html',
  styleUrls: ['./list-base.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListBaseComponent extends CoreComponent implements OnInit {
  @ViewChild('spModalHost', { read: ViewContainerRef, static: false }) public modalHostViewContainer: ViewContainerRef;
  private lastNavbarDisplayMode = NavbarDisplayMode.None;
  private lastNavbarRightIcon: IIconAction;

  @Output() public itemRender: EventEmitter<IListItemModel> = new EventEmitter();
  @Output() public itemAvatarClick: EventEmitter<IListItemModel> = new EventEmitter();
  @Output() public itemContentClick: EventEmitter<IListItemModel> = new EventEmitter();
  @Output() public afterInit: EventEmitter<IListBaseModel> = new EventEmitter();

  @Input() infoTemplate: TemplateRef<any>;
  @Input() imageOverlayTemplate: TemplateRef<any>;
  @Input() public model: IListBaseModel = {
    listUpdatedEvent: null,
    itemMenuList: [],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    breadcrumbsEnabled: false
  };


  constructor(
    private events: EventsService,
    private loadingService: LoadingViewStateService,
    private navbarService: NavBarStateService,
    private breadcrumbService: BreadcrumbsStateService,
    private navigation: NavigationService,
    private route: ActivatedRoute,
    private utilities: UtilityService,
    private log: LogService,
    private cd: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    // List updated
    this.subs.sink = this.events.onEvent<ICriteriaResult<any>>(this.model.listUpdatedEvent).subscribe(response => {
      this.model.criteriaResult = response;
      this.cd.detectChanges();
      this.afterListUpdated();
    });

    // Breadcrumbs
    if (this.model.breadcrumbsEnabled) {
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
    // This was implemented for scenarios where the breadcrumb changes the query param
    // but it doesn't change the route
    this.subs.sink = this.route.queryParams.subscribe(p => {
      // Param changed, but not the route
      if (!this.navigation.routeChanged()) {
        // If this param matches the very first route then this is the very first time loading, so skip this step
        // and allow the ng init to load the data
        const firstNavigation = this.navigation.first();
        if (!firstNavigation || !firstNavigation.options || !firstNavigation.options.queryParams || p.queryId !== firstNavigation.options.queryParams.queryId) {
          this.log.debug('Query param changed, loading list base data.');
          this.loadData();
        }
      }
    });

    if (!this.model.getDisplayInfo) {
      this.model.getDisplayInfo = model => {
        return `Found: ${model.criteriaResult.items.length} item` + (model.criteriaResult.items.length !== 1 ? 's' : '');
      };
    }

    this.initializeNavbar();
    this.afterInit.emit(this.model);
    this.log.debug('Loading list base data for the first time.');
    this.loadData();
  }

  public onIntersectionChange(isIntersecting: boolean, item: IListItemModel): void {
    if (item.canBeRendered !== isIntersecting) {
      if (this.model.prepareItemRender) {
        this.model.prepareItemRender(item);
      }
      item.canBeRendered = isIntersecting;
      if (item.canBeRendered) {
        this.itemRender.emit(item);
      }
    }
  }

  public onAvatarClick(item: IListItemModel): void {
    this.itemAvatarClick.emit(item);
  }

  public onContentClick(item: IListItemModel): void {
    this.itemContentClick.emit(item);
  }

  public scrollTo(index: number): void {
    const rowHeight = 55;
    const yPosition = index * rowHeight;
    this.utilities.scroll(0, yPosition);
  }

  private afterListUpdated(): void {
    this.updateFilterIcon();
    this.loadingService.hide();
    this.showInfo();
  }

  public showInfo(): void {
    const message = this.model.getDisplayInfo(this.model);
    this.navbarService.showToast(message);
  }

  private updateFilterIcon(): void {
    const navbar = this.navbarService.getState();
    if (this.model.criteriaResult.criteria.hasComparison(true)) {
      navbar.leftSubIcon = 'mdi-filter mdi sp-color-primary sp-text-shadow-dark';
      navbar.leftIcon.action = () => {
        this.navigation.forward(AppRoute.Queries, { routeParams: [this.model.criteriaResult.criteria.id] });
      };
    }
    else {
      navbar.leftSubIcon = null;
      navbar.leftIcon.action = null;
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
      navbar.leftIcon = this.model.leftIcon;
    }
    // If the left icon is not specified, get it from the route
    else if (routeInfo) {
      navbar.leftIcon = {
        icon: routeInfo.icon
      };
    }
    
    if (this.model.rightIcon) {
      navbar.rightIcon = this.model.rightIcon;
    }
    else {
      // Search icon by default
      navbar.rightIcon = {
        icon: 'mdi-magnify mdi',
        action: () => {
          this.toggleSearch(navbar);
        }
      };
    }

    // Search
    navbar.onSearch = searchTerm => {
      if (this.model.broadcastService) {
        this.loadingService.show();
        this.model.broadcastService.search(this.model.criteriaResult.criteria.clone(), searchTerm).subscribe();
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
        caption: 'Filter',
        icon: 'mdi-filter-outline mdi',
        action: () => {
          this.navigation.forward(AppRoute.Queries, { routeParams: [this.model.criteriaResult.criteria.id] });
        }
      },
      {
        caption: 'Show Count',
        icon: 'mdi-counter mdi',
        action: () => {
          this.displayListInfo();
        }
      }
    ];
  }

  private displayListInfo(): void {
    this.displayItemCount();
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
      // Clear previous search value by performing an empty search
      navbar.searchTerm = '';
      if (navbar.onSearch) {
        navbar.onSearch(navbar.searchTerm);
      }
      navbar.mode = this.lastNavbarDisplayMode;
      navbar.rightIcon = this.lastNavbarRightIcon;
    }
    else {
      this.lastNavbarDisplayMode = navbar.mode;
      this.lastNavbarRightIcon = navbar.rightIcon;
      // Starting over so clear the search
      navbar.searchTerm = '';
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

    this.model.broadcastService.send(navInfo.options.criteria).subscribe(() => {
      // Enable title if no breadcrumbs
      if (!this.model.breadcrumbsEnabled || !this.breadcrumbService.hasBreadcrumbs()) {
        this.navbarService.getState().mode = NavbarDisplayMode.Title;
      }
    });
  }

  public toggleSelection(item: IListItemModel): void {
    item.selected = !item.selected;
    this.cd.detectChanges();
  }

  public getRecentIcon(days: number): IIcon {
    const timeAgo = this.utilities.getTimeAgo(days);
    if (timeAgo === TimeAgo.Today) {
      return { styleClass: '', tooltip: 'Added today' };
    }
    if (timeAgo === TimeAgo.Yesterday) {
      return { styleClass: '', tooltip: 'Added yesterday' };
    }
    const tooltip = `Added ${days} days ago`;
    if (timeAgo === TimeAgo.OneWeek || timeAgo === TimeAgo.TwoWeeks) {
      return { styleClass: 'sp-opacity-66', tooltip: tooltip };
    }
    if (timeAgo === TimeAgo.OneMonth) {
      return { styleClass: 'sp-opacity-33', tooltip: tooltip };
    }
    return { styleClass: 'sp-no-display' };
  }
}
