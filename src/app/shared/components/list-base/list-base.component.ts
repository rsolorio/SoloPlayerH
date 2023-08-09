import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
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
      this.subs.sink = this.events.onEvent<BreadcrumbEventType>(AppEvent.BreadcrumbUpdated).subscribe(() => {
        // Reload breadcrumbs automatically
        // If you don't want the component react to its own breadcrumb changes, set suppressEvents = true
        this.reloadFromBreadcrumbs();
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
    this.loadingService.hide();
    this.showInfo();
  }

  public showInfo(): void {
    const message = this.model.getDisplayInfo(this.model);
    this.navbarService.showToast(message);
  }

  private initializeNavbar(): void {
    const routeInfo = this.utilities.getCurrentRouteInfo();
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

    navbar.rightIcons = this.model.rightIcons ? this.model.rightIcons : [];
    // Search icon
    const searchIcon: IIconAction = {
      id: 'searchIcon',
      icon: 'mdi-magnify-remove-outline mdi',
      action: iconAction => {
        // This will turn OFF the search
        iconAction.off = true;
        navbar.searchTerm = '';
        if (navbar.onSearch) {
          navbar.onSearch(navbar.searchTerm);
        }
        // The only way to get to the search mode if from the Title mode,
        // so for now go back to title mode from search mode
        this.setNavbarMode(NavbarDisplayMode.Title);
      },
      off: true, // Search turned off by default
      offIcon: 'mdi-magnify mdi',
      offAction: iconAction => {
        // This will turn ON the search
        iconAction.off = false;
        navbar.searchTerm = '';
        this.setNavbarMode(NavbarDisplayMode.Search);
        // Give the search box time to render before setting focus
        setTimeout(() => {
          this.navbarService.searchBoxFocus();
        });
      }
    };
    navbar.rightIcons.push(searchIcon);
    if (this.breadcrumbService.hasBreadcrumbs()) {
      // Hide search
      // How to determine which other icons to hide?
      // Show/hide state for every navbar mode?
    }

    // Search
    navbar.onSearch = searchTerm => {
      this.search(this.model.criteriaResult.criteria.clone(), searchTerm);
    };

    // Setup navbar breadcrumbs if supported
    navbar.componentType = this.model.breadcrumbsEnabled ? BreadcrumbsComponent : null;
    // Make sure the component is loaded (or discarded), even if it is not visible
    this.navbarService.loadComponent(navbar.componentType);

    this.setDefaultNavbarMode();

    // Menu list
    navbar.menuList = [
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

  public getSelectedItems():IListItemModel[] {
    return this.model.criteriaResult.items.filter(item => item.selected);
  }

  public search(criteria: Criteria, searchTerm?: string): void {
    if (this.model.broadcastService) {
      this.loadingService.show();
      this.model.broadcastService.search(criteria, searchTerm).subscribe();
    }
  }

  /**
   * Loads the data via broadcast.
   * The data is retrieved using the criteria associated with the current route;
   * if the route doesn't have any criteria, it will use the last criteria from the last result.
   */
  private loadData(): void {
    // Show the animation here, it will be hidden by the broadcast service
    this.loadingService.show();
    // Use a copy of the last query in case the current navigation doesn't have a query
    const navInfo = this.navigation.current();
    navInfo.options = navInfo.options || {};
    if (!navInfo.options.criteria) {
      navInfo.options.criteria = this.model.criteriaResult.criteria.clone();
    }

    this.model.broadcastService.send(navInfo.options.criteria).subscribe(() => {
      this.setDefaultNavbarMode();
    });
  }

  public toggleSelection(item: IListItemModel): void {
    item.selected = !item.selected;
    this.cd.detectChanges();
  }

  public getRecentIcon(days: number): IIcon {
    const timeAgo = this.utilities.getTimeAgo(days);
    const icon: IIcon = {
      icon: 'mdi-vanish-quarter mdi',
      tooltip: `Added ${days} days ago`,
      styleClass: '' // Undefined will give a template error
    };
    switch (timeAgo) {
      case TimeAgo.Today:
        icon.tooltip = 'Added today';
        break;
      case TimeAgo.Yesterday:
        icon.tooltip = 'Added yesterday';
        break;
      case TimeAgo.OneWeek:
      case TimeAgo.TwoWeeks:
        icon.styleClass = 'sp-opacity-66';
        break;
      case TimeAgo.OneMonth:
        icon.styleClass = 'sp-opacity-33';
        break;
      default:
        icon.hidden = true;
        break;
    }
    return icon;
  }

  private discardSearch(): void {
    const navbar = this.navbarService.getState();
    navbar.searchTerm = '';
    const searchIcon = this.model.rightIcons.find(i => i.id === 'searchIcon');
    if (searchIcon) {
      searchIcon.off = true;
    }
  }

  /**
   * Reloads the route with the existing breadcrumb data
   */
  private reloadFromBreadcrumbs(): void {
    // Since we are staying in the same route, use the same query info, just update the breadcrumbs
    const criteriaClone = this.model.criteriaResult.criteria.clone();
    // Since there was a breadcrumb update, set the new value also with a copy
    criteriaClone.breadcrumbCriteria = this.breadcrumbService.getCriteria().clone();
    // Clear search criteria since this is only using breadcrumbs
    this.discardSearch();
    criteriaClone.searchCriteria.clear();
    // Set nav bar mode
    this.setDefaultNavbarMode();
    // Navigate to the same route but with the new object
    this.navigation.forward(this.navigation.current().route, { criteria: criteriaClone });
  }

  /**
   * Sets the breadcrumb mode if supported and data is available, otherwise it will set the Title mode.
   */
  private setDefaultNavbarMode(): void {
    if (this.model.breadcrumbsEnabled && this.breadcrumbService.hasBreadcrumbs()) {
      this.setNavbarMode(NavbarDisplayMode.Component);
    }
    else {
      this.setNavbarMode(NavbarDisplayMode.Title);
    }
  }

  /**
   * Sets the navbar mode, handles the right icons visibility
   * and fires the navbarModeChange event.
   */
  private setNavbarMode(mode: NavbarDisplayMode): void {
    const navbar = this.navbarService.getState();
    // We should not validate if the navbar already has the same mode
    // since the same mode applies to all entities and the same mode
    // can have different icons on different views
    navbar.mode = mode;

    // Handle icon visibility
    switch (mode) {
      case NavbarDisplayMode.Component:
        // Hide all the icons
        navbar.rightIcons.forEach(icon => icon.hidden = true);
        break;
      case NavbarDisplayMode.Title:
        // Show all icons
        navbar.rightIcons.forEach(icon => icon.hidden = false);
        break;
      case NavbarDisplayMode.Search:
        // Show search, hide the rest of the icons
        navbar.rightIcons.forEach(icon => {
          if (icon.id === 'searchIcon') {
            icon.hidden = false;
          }
          else {
            icon.hidden = true;
          }
        });
        break;
    }
    // Fire this event that will allow customize the behavior above
    if (this.model.afterNavbarModeChange) {
      this.model.afterNavbarModeChange(navbar);
    }
  }
}
