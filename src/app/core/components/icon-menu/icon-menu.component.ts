import { Component, OnInit, Input, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { IIconMenuModel } from './icon-menu-model.interface';
import { IMenuModel } from '../../models/menu-model.interface';
import { SlideMenu } from 'primeng/slidemenu';
import { MenuService } from '../../services/menu/menu.service';
import { EventsService } from '../../services/events/events.service';
import { CoreEvent } from '../../services/events/events.enum';

@Component({
  selector: 'sp-icon-menu',
  templateUrl: './icon-menu.component.html',
  styleUrls: ['./icon-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconMenuComponent implements OnInit {
  @ViewChild('menu') private menu: SlideMenu;

  public model: IIconMenuModel = {
    icon: 'mdi-dots-vertical mdi',
    items: [],
    context: null
  };

  constructor(private menuService: MenuService, private events: EventsService, private cdr: ChangeDetectorRef) { }

  get icon(): string {
    return this.model.icon;
  }

  @Input() set icon(val: string) {
    this.model.icon = val;
  }

  get items(): IMenuModel[] {
    return this.model.items;
  }

  @Input() set items(val: IMenuModel[]) {
    this.model.items = val;
  }

  get context(): any {
    return this.model.context;
  }

  @Input() set context(val: any) {
    this.model.context = val;
  }

  get visibleItemCount(): number {
    return this.model.visibleItemCount;
  }

  @Input() set visibleItemCount(val: number) {
    this.model.visibleItemCount = val;
  }

  public ngOnInit(): void {
    this.events.onEvent(CoreEvent.RouteChanging).subscribe(() => {
      this.menuService.hideSlideMenu();
    });
  }

  public onIconClick(e: any): void {
    // Prevent any other parent element to fire click actions
    e.stopPropagation();
    this.menuService.buildSlideMenu(this.menu, this.model.items, this.model.context);

    let autoHeight = true;
    if (this.model.visibleItemCount && this.model.visibleItemCount > 0) {
      this.menuService.setSlideMenuHeight(this.menu, this.model.visibleItemCount, 0);
      autoHeight = false;
    }
    this.menuService.showSlideMenu(this.menu, this.cdr, e, autoHeight);
  }
}
