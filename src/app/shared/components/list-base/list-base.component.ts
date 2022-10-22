import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { INavbarModel } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { IListModel } from '../../models/base-model.interface';
import { AppEvent } from '../../models/events.enum';
import { IPaginationModel } from '../../models/pagination-model.interface';
import { QuickSearchComponent } from '../quick-search/quick-search.component';
import { IListBaseModel } from './list-base-model.interface';

@Component({
  selector: 'sp-list-base',
  templateUrl: './list-base.component.html',
  styleUrls: ['./list-base.component.scss']
})
export class ListBaseComponent extends CoreComponent implements OnInit {

  public model: IListBaseModel = {
    listUpdatedEvent: null,
    itemMenuList: [],
    navbarMenuList: [],
    paginationModel: {
      items: []
    }
  };

  @Output() public searchFired: EventEmitter<string> = new EventEmitter();
  @Output() public favoriteClick: EventEmitter<Event> = new EventEmitter();
  @Output() public itemImageSet: EventEmitter<IListModel> = new EventEmitter();
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

  @Input() set navbarMenuList(val: IMenuModel[]) {
    this.model.navbarMenuList = val;
  }
  get navbarMenuList(): IMenuModel[] {
    return this.model.navbarMenuList;
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

    // Search
    this.subs.sink = this.events.onEvent<string>(AppEvent.QuickSearchFired).subscribe(response => {
      this.searchFired.emit(response);
    });

    this.initialized.emit();
    this.initializeNavBar();
  }

  protected initializeNavBar(): void {
    const navbarModel: INavbarModel = {
      show: true,
      menuList: this.model.navbarMenuList,
      componentType: QuickSearchComponent,
      leftIcon: {
        icon: 'mdi-heart-outline mdi',
        action: () => {
          this.favoriteClick.emit();
        }
      },
      rightIcon: {
        icon: 'mdi-filter-multiple-outline mdi',
        action: () => {}
      }
    };

    this.navbarService.set(navbarModel);
  }

  protected broadcastItems(): void {}

  public onIntersectionChange(isIntersecting: boolean, item: IListModel): void {
    item.canBeRendered = isIntersecting;
    if (isIntersecting && !item.imageSrc) {
      item.imageSrc = '../assets/img/default-image-small.jpg';
      this.itemImageSet.emit(item);
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
}
