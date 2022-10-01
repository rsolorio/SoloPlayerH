import { Component, OnInit, HostListener, Inject, HostBinding } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

import { EventType } from './core/services/events/events.enum';
import { EventsService } from './core/services/events/events.service';
import { BreakpointMode } from './core/services/utility/utility.enum';
import { IWindowSize, IWindowSizeChangedEvent } from './core/services/utility/utility.interface';
import { UtilityService } from './core/services/utility/utility.service';
import { DatabaseService } from './shared/services/database/database.service';
import { LogService } from './core/services/log/log.service';

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
  @HostBinding('style.background-color') public backgroundColor: string;
  private lastScrollTop = 0;

  constructor(
    @Inject(DOCUMENT) private doc: Document,
    dbService: DatabaseService,
    private utilities: UtilityService,
    private events: EventsService,
    private log: LogService,
    private router: Router) {
    dbService.dataSource.initialize().then(ds => {
      console.log('Database initialized!');
    });
  }

  public ngOnInit(): void {
    this.setAppBackground();
    this.watchRouteChange();
    this.utilities.setAppVersion('0.0.1');
  }

  @HostListener('window:scroll', ['$event'])
  private onScroll($event: Event): void {
    if (this.doc.documentElement.scrollTop !== undefined) {
      if (this.doc.documentElement.scrollTop > this.lastScrollTop) {
        this.events.broadcast(EventType.WindowScrollDown);
      }
      else {
        this.events.broadcast(EventType.WindowScrollUp);
      }
      this.lastScrollTop = this.doc.documentElement.scrollTop;
    }
    else {
      this.log.warn('Scroll could not be detected.');
    }
  }

  @HostListener('window:click', ['$event'])
  private onClick($event: Event): void {
    this.events.broadcast(EventType.WindowClick, $event);
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
      this.events.broadcast(EventType.BreakpointChanged, newSize);
      if (newSize.mode === BreakpointMode.Small) {
        this.events.broadcast(EventType.BreakpointReduced, newSize);
      }
      else if (newSize.mode === BreakpointMode.Large) {
        this.events.broadcast(EventType.BreakpointExtended, newSize);
      }
    }
    this.events.broadcast<IWindowSizeChangedEvent>(EventType.WindowSizeChanged, {old: oldSize, new: newSize});
  }

  private watchRouteChange(): void {
    this.router.events.subscribe(action => {
      if (action instanceof NavigationStart) {
        const navStart = action as NavigationStart;
        const route = this.utilities.getUrlWithoutParams(navStart.url);
        this.events.broadcast<string>(EventType.RouteChanging, route);
      }
      else if (action instanceof NavigationEnd) {
        const navEnd = action as NavigationEnd;
        const route = this.utilities.getUrlWithoutParams(navEnd.url);
        this.events.broadcast<string>(EventType.RouteChanged, route);
      }
    });
  }

  private setAppBackground(): void {
    // TODO: set the color using the styles
    this.backgroundColor = '#121212';
  }
}
