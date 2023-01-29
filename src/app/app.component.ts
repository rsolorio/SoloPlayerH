import { Component, OnInit, HostListener, Inject, HostBinding } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

import { CoreEvent } from './core/services/events/events.enum';
import { EventsService } from './core/services/events/events.service';
import { BreakpointMode } from './core/services/utility/utility.enum';
import { IWindowSize, IWindowSizeChangedEvent } from './core/services/utility/utility.interface';
import { UtilityService } from './core/services/utility/utility.service';
import { DatabaseService } from './shared/services/database/database.service';
import { LogService } from './core/services/log/log.service';
import { FeatureDetectionService } from './core/services/feature-detection/feature-detection.service';
import { AppEvent } from './shared/models/events.enum';
import { LogLevel } from './core/services/log/log.enum';
import { NavigationService } from './shared/services/navigation/navigation.service';
import { IMenuModel } from './core/models/menu-model.interface';

/**
 * The main app component.
 * It is using the body selector in order to be able to set the background image by using host binding.
 * Ignoring tslint rule for having kebab case in the selector, since this is a special case.
 */
@Component({
  selector: 'body', // tslint:disable-line:component-selector
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  //@HostBinding('style.background-color') public backgroundColor: string;
  @HostBinding('class') private cssClass: string = 'sp-bg sp-scroll-x-disabled';
  private lastScrollTop = 0;

  constructor(
    @Inject(DOCUMENT) private doc: Document,
    private db: DatabaseService,
    private utilities: UtilityService,
    private events: EventsService,
    private log: LogService,
    private router: Router,
    private featureService: FeatureDetectionService,
    private navigation: NavigationService)
  {
    doc.addEventListener('DOMContentLoaded', this.onDomContentLoaded);
  }

  public ngOnInit(): void {
    this.utilities.setAppVersion('0.0.1');
    this.log.setLevel(LogLevel.Verbose);
    this.watchRouteChange();
    this.log.info('Feature info initialized.', this.featureService.get());

    this.events.onEvent<IMenuModel>(CoreEvent.SidebarMenuAction).subscribe(menuModel => {
      this.navigation.forward(menuModel.route);
    });

    this.events.onEvent(AppEvent.DbInitialized).subscribe(() => {
      this.db.initializeModuleOptions().then(() => {
        this.log.info('Module options initialized!');
      });
    });
    
    this.db.initialize();
  }

  @HostListener('window:scroll', ['$event'])
  private onScroll($event: Event): void {
    if (this.doc.documentElement.scrollTop !== undefined) {
      if (this.doc.documentElement.scrollTop > this.lastScrollTop) {
        this.events.broadcast(CoreEvent.WindowScrollDown);
      }
      else {
        this.events.broadcast(CoreEvent.WindowScrollUp);
      }
      this.lastScrollTop = this.doc.documentElement.scrollTop;
    }
    else {
      this.log.warn('Scroll could not be detected.');
    }
  }

  @HostListener('window:click', ['$event'])
  private onClick($event: Event): void {
    this.events.broadcast(CoreEvent.WindowClick, $event);
  }

  @HostListener('window:resize', ['$event'])
  private onResize($event: Event): void {
    const oldSize = this.utilities.getCurrentWindowSize();
    const newSize = this.utilities.calculateWindowSize($event.target as Window);
    this.broadcastWindowSizeEvents(newSize, oldSize);
  }

  private broadcastWindowSizeEvents(newSize: IWindowSize, oldSize?: IWindowSize): void {
    // If the breakpoint changed fire an event
    if (!oldSize || oldSize.mode !== newSize.mode) {
      this.events.broadcast(CoreEvent.BreakpointChanged, newSize);
      if (newSize.mode === BreakpointMode.Small) {
        this.events.broadcast(CoreEvent.BreakpointReduced, newSize);
      }
      else if (newSize.mode === BreakpointMode.Large) {
        this.events.broadcast(CoreEvent.BreakpointExtended, newSize);
      }
    }
    this.events.broadcast<IWindowSizeChangedEvent>(CoreEvent.WindowSizeChanged, {old: oldSize, new: newSize});
  }

  private watchRouteChange(): void {
    this.router.events.subscribe(action => {
      if (action instanceof NavigationStart) {
        const navStart = action as NavigationStart;
        const route = this.utilities.getUrlWithoutParams(navStart.url);
        this.events.broadcast<string>(CoreEvent.RouteChanging, route);
      }
      else if (action instanceof NavigationEnd) {
        const navEnd = action as NavigationEnd;
        const url = navEnd.urlAfterRedirects ? navEnd.urlAfterRedirects : navEnd.url;
        const route = this.utilities.getUrlWithoutParams(url);
        this.events.broadcast<string>(CoreEvent.RouteChanged, route);
      }
    });
  }

  private onDomContentLoaded(): void {

  }
}
