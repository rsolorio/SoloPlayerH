import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { DefaultImageSrc } from 'src/app/core/globals.enum';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { IListModel } from '../../models/base-model.interface';
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
    }
  };
  private lastNavbarDisplayMode = NavbarDisplayMode.None;

  @Output() public itemRender: EventEmitter<IListModel> = new EventEmitter();
  @Output() public itemImageClick: EventEmitter<IListModel> = new EventEmitter();
  @Output() public itemContentClick: EventEmitter<IListModel> = new EventEmitter();
  @Output() public initialized: EventEmitter<Event> = new EventEmitter();

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

    this.initializeNavbar();
    this.initialized.emit();
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
      icon: 'mdi-magnify mdi',
      action: () => {
        if (navbar.mode === NavbarDisplayMode.Search) {
          // TODO: save previous mode
          navbar.mode = this.lastNavbarDisplayMode;
          navbar.rightIcon.icon = 'mdi-magnify mdi';
        }
        else {
          this.lastNavbarDisplayMode = navbar.mode;
          navbar.mode = NavbarDisplayMode.Search;
          navbar.rightIcon.icon = 'mdi-magnify-remove-outline mdi';
          // Give the search box time to render before setting focus
          setTimeout(() => {
            this.navbarService.searchBoxFocus();
          });
        }
      }
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
  }
}
