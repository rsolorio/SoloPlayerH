import { Injectable, NgZone } from '@angular/core';
import { IWindowSize, IWindowSizeChangedEvent, ITimeSpan } from './utility.interface';
import { BreakpointMode, Milliseconds } from './utility.enum';
import { BreakpointRanges } from './utility.class';
import { EventsService } from '../../../core/services/events/events.service';
import { CoreEvent } from '../../../core/services/events/events.enum';
import { Router, ActivatedRoute } from '@angular/router';
import { LogService } from 'src/app/core/services/log/log.service';
import { ISize } from 'src/app/core/models/core.interface';
import { RouterCacheService } from '../router-cache/router-cache.service';
import { AppRoute, appRoutes, IAppRouteInfo } from 'src/app/app-routes';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  private windowSize: IWindowSize;
  private msPerDay = 1000 * 60 * 60 * 24;
  public readonly guidEmpty = '00000000-0000-0000-0000-000000000000';

  constructor(
    private events: EventsService,
    private router: Router,
    private routerCache: RouterCacheService,
    private log: LogService,
    public ngZone: NgZone) {
    events.onEvent<IWindowSizeChangedEvent>(CoreEvent.WindowSizeChanged).subscribe(eventData => {
      this.windowSize = eventData.new;
      this.log.debug('Window size changed.');
    });
  }

  public setAppVersion(version: string): void {
    (window as any).solAppVersion = version;
  }

  public getAppVersion(): string {
    return (window as any).solAppVersion;
  }

  /** Determines if the specified value represents an empty guid. */
  public isGuidEmpty(guid: string): boolean {
    return guid === this.guidEmpty;
  }

  /** Returns a new guid. */
  public newGuid(): string {
    return [this.genHex(2), this.genHex(1), this.genHex(1), this.genHex(1), this.genHex(3)].join('-');
  }

  /** Creates a hexadecimal number of 4 digits x number of times. */
  private genHex(count: number): string {
    let out = '';
    for (let i = 0; i < count; i++) {
        // tslint:disable-next-line:no-bitwise
        out += (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return out;
  }

  /** Determines if the argument is a function. */
  public isFunction(arg: any): boolean {
    return arg !== undefined && arg !== null && typeof arg === 'function';
  }

  /**
   * Moves the scrollbar of the specified element to the top.
   * @param elementId The identifier of the element that will scroll to the top. If null, the function will scroll the whole window.
   */
  public scrollToTop(elementId?: string): void {
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollTop = 0;
      }
    }
    else {
      // Lets assume the dev wants to scroll the window
      window.scrollTo(0, 0);
    }
  }

  /**
   * Gets the window size information.
   * @param window The window to get the info from.
   */
  public calculateWindowSize(window: Window): IWindowSize {
    const size: ISize = {
      height: window.innerHeight,
      width: window.innerWidth
    };

    let mode = BreakpointMode.Large;

    if (size.width < BreakpointRanges.large.from) {
      mode = BreakpointMode.Small;
    }

    return {
      size,
      mode
    };
  }

  /**
   * Returns the stateful data of the window size.
   */
  public getCurrentWindowSize(): IWindowSize {
    if (!this.windowSize) {
      this.windowSize = this.calculateWindowSize(window);
    }
    return this.windowSize;
  }

  public navigate(route: string | AppRoute, removeRouteParams?: boolean): void {
    if (removeRouteParams) {
      this.router.navigateByUrl(route);
    }
    else {
      this.router.navigate([route]);
    }
  }

  /**
   * Navigates to the specified route.
   * It accepts a list of values which should match the route parameters of the path.
   * In a resolver you can get the specified param like this: ActivatedRouteSnapshot.paramMap.get('nameOfTheRouteParam')
   * Route param example: yourRoute/details/yourRouteParam/info
   */
  public navigateWithRouteParams(route: string | AppRoute, params: any[]): void {
    const commands: any[] = [];
    // First add the route
    commands.push(route);
    // Then add the params if any
    for (const p of params) {
      commands.push(p);
    }
    this.router.navigate(commands);
  }

  /**
   * Navigates to the specified route.
   * It accepts a set of key/value pairs as optional parameters, but values have to be strings.
   */
  public navigateWithOptionalParams(route: string | AppRoute, optionalParams: any): void {
    this.router.navigate([route, optionalParams]);
  }

  /**
   * Navigates to the specified route.
   * It accepts a list of query parameters.
   * Usage: navigateWithQueryParams('yourRoute', { yourQueryParam: 'someValue' });
   * Query param example: yourRoute?yourQueryParam=someValue
   */
  public navigateWithQueryParams(route: string | AppRoute, queryParams: any, complexData?: any): void {
    if (complexData) {
      this.router.navigate([route], { queryParams, state: complexData });
    }
    else {
      this.router.navigate([route], { queryParams });
    }
  }

  /** Returns the value of the specified query param from the activated route. */
  public getQueryParam(paramName: string, route: ActivatedRoute): any {
    return route.snapshot.queryParams[paramName];
  }

  /**
   * Returns the value of the specified route param from the activated route.
   * The reason why we ask for an activated route is because this service will not have an activated route on its own.
   */
  public getRouteParam(paramName: string, route: ActivatedRoute): any {
    return route.snapshot.params[paramName];
  }

  /**
   * Navigates to the specified route.
   * The route has to implement a route resolver in order to pass the complex parameter.
   * The caller code must understands the interface expected by the resolver and the name of the param returned by the resolver.
   * Call getResolverParam to get the param sent through this method.
   */
  public navigateWithComplexParams(route: string | AppRoute, complexParams: any): void {
    this.routerCache.set(complexParams);
    this.router.navigate([route]);
  }

  /**
   * Gets the value of the specified param returned by a resolver.
   * This is usually used to get the data sent through the navigateWithComplexParams method.
   */
  public getResolverParam(paramName: string, route: ActivatedRoute): any {
    return route.snapshot.data[paramName];
  }

  public getCurrentRoute(): string {
    const routeParts = this.router.url.split('?');
    return routeParts[0];
  }

  public isRouteActive(route: AppRoute): boolean {
    // Remove query params if any
    const routeParts = this.router.url.split('?');
    const root = routeParts[0];
    return root === route;
  }

  public getCurrentRouteInfo(): IAppRouteInfo {
    return appRoutes[this.getCurrentRoute()];
  }

  /** Returns the difference in days between two dates. */
  public differenceInDays(date1: Date, date2: Date): number {
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc1 - utc2) / this.msPerDay);
  }

  public toReadableDate(date: Date, dateSeparator?: string): string {
    const yearText = date.toLocaleString('default', { year: 'numeric'});
    const monthText = date.toLocaleString('default', { month: '2-digit'});
    const dayText = date.toLocaleString('default', { day: '2-digit'});

    if (!dateSeparator) {
      dateSeparator = '-';
    }
    return `${yearText}${dateSeparator}${monthText}${dateSeparator}${dayText}`;
  }

  public toReadableDateAndTime(date: Date, dateSeparator?: string): string {
    const readableDate = this.toReadableDate(date, dateSeparator);
    return `${readableDate}, ${date.toLocaleTimeString()}`;
  }

  /**
   * Converts the specified number of seconds to the format mm:ss
   */
  public secondsToMinutes(value: number): string {
    const valueInt = Math.floor(value);
    const minutes = Math.floor(valueInt / 60);
    const secondsLeft = valueInt % 60;
    return `${this.enforceDigits(minutes, 2)}:${this.enforceDigits(secondsLeft, 2)}`;
  }

  /**
   * Converts the specified number of seconds to the format HH:mm:ss
   * @param value The number of seconds to format
   */
  public secondsToHours(value: number): string {
    const valueInt = Math.floor(value);
    const hours = Math.floor(valueInt / 3600);
    let secondsLeft = valueInt % 3600;
    const minutes = Math.floor(secondsLeft / 60);
    secondsLeft = secondsLeft % 60;
    const minutesAndSeconds = `${this.enforceDigits(minutes, 2)}:${this.enforceDigits(secondsLeft, 2)}`;
    if (hours) {
      return `${this.enforceDigits(hours, 2)}:${minutesAndSeconds}`;
    }
    return minutesAndSeconds;
  }

  public daysToMilliseconds(days: number): number {
    return days * this.msPerDay;
  }

  public toTimeSpan(milliseconds: number, timeUnits?: Milliseconds[]): ITimeSpan {
    const result: ITimeSpan = {
      total: milliseconds
    };
    let msLeft = milliseconds;
    const timeUnitsInOrder = [Milliseconds.Day, Milliseconds.Hour, Milliseconds.Minute, Milliseconds.Second, Milliseconds.Millisecond];

    if (!timeUnits || !timeUnits.length) {
      timeUnits = timeUnitsInOrder;
    }

    timeUnitsInOrder.forEach(timeUnit => {
      if (timeUnits.includes(timeUnit)) {
        const value = Math.floor(msLeft / timeUnit);
        msLeft -= value * timeUnit;

        switch (timeUnit) {
          case Milliseconds.Day:
            result.days = value;
            break;
          case Milliseconds.Hour:
            result.hours = value;
            break;
          case Milliseconds.Minute:
            result.minutes = value;
            break;
          case Milliseconds.Second:
            result.seconds = value;
            break;
          case Milliseconds.Millisecond:
            result.milliseconds = value;
            break;
        }
      }
    });
    return result;
  }

  public formatTimeSpan(timeSpan: ITimeSpan): string {
    const result: string[] = [];

    if (timeSpan.days) {
      result.push(timeSpan.days + ' days');
    }
    if (timeSpan.hours) {
      result.push(timeSpan.hours + ' hours');
    }
    if (timeSpan.minutes) {
      result.push(timeSpan.minutes + ' minutes');
    }
    if (timeSpan.seconds) {
      result.push(timeSpan.seconds + ' seconds');
    }
    if (timeSpan.milliseconds) {
      result.push(timeSpan.milliseconds + ' milliseconds');
    }

    return result.join(', ');;
  }

  /**
   * Ensures the given value has at least the number of specified digits.
   * If the value is 0 and the digits is 0 then it will return an empty string.
   * @param value The value to format
   * @param digits The number of digits to enforce
   */
  public enforceDigits(value: number, digits: number): string {
    if (digits === 0 && value === 0) {
      // In this particular case return an empty string
      return '';
    }
    let numberText = value.toString();
    const numberDigits = numberText.length;

    if (numberDigits < digits) {
      for (let d = numberDigits; d < digits; d++) {
        numberText = '0' + numberText;
      }
    }
    return numberText;
  }

  public round(value: number, decimals: number): number {
    return parseFloat(value.toFixed(decimals));
  }

  public getDecade(year: number): number {
    return Math.floor(year / 10) * 10;
  }

  /**
   * Changes the theme-color meta tag used by the mobile chrome browser.
   */
  public changeThemeColor(color: string): void {
    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    metaThemeColor.setAttribute('content', color);
  }

  public getUrlWithoutParams(url: string): string {
    const index = url.indexOf('?');
    if (index >= 0) {
      return url.substring(0, index);
    }
    return url;
  }

  /**
   * Gets the enumeration item name based on its value.
   * @param value The enumeration value converted to string.
   * @param enumType The enumeration object.
   */
  public getEnumNameByValue(value: string, enumType: any): string {
    let result = '';
    Object.keys(enumType).forEach(propertyName => {
      if (!result) {
        const propertyValue = enumType[propertyName];
        if (propertyValue.toString() === value) {
          result = propertyName;
        }
      }
    });
    return result;
  }

  /**
   * Finds the value of the property specified by the path.
   * @param sourceObject Object that contains the property
   * @param propertyPath The path to the property in the format: property1.property2.property3
   * @returns The value of the property.
   */
  public getPropertyValue(sourceObject: any, propertyPath: string): any {
    const properties = propertyPath.split('.');

    let result = sourceObject;
    properties.forEach(property => {
      if (result !== undefined && result !== null) {
        result = result[property];
      }
    });

    return result;
  }

  /**
   * Returns a new array of sorted items.
   * @param items List of items to sort.
   * @param sortProperty Property name used to perform the comparison in the sort process.
   * @param desc If the sort should be descending or not
   */
  public sort<T>(items: T[], sortProperty: string, desc?: boolean): T[] {
    // Adding sort result to a variable instead of directly returning it
    // will solve the build error caused by using lambdas in static functions
    const result = items.sort((a, b) => {
      const aProperty = this.getPropertyValue(a, sortProperty);
      const bProperty = this.getPropertyValue(b, sortProperty);
      if (aProperty > bProperty) {
        if (desc) {
          return -1;
        }
        return 1;
      }
      if (aProperty < bProperty) {
        if (desc) {
          return 1;
        }
        return -1;
      }
      return 0;
    });
    return result;
  }

  public groupByKey<T>(items: T[], keyProperty: string): { [key: string]: T[] } {
    return this.group(items, item => item[keyProperty]);
  }

  public group<T>(items: T[], getKeyFn: (item: T) => string): { [key: string]: T[] } {
    return items.reduce((storage, item) => {
      // Key that will be used to group
      const groupKey = getKeyFn(item);
      // Initialize the array for this particular group if needed
      storage[groupKey] = storage[groupKey] || [];
      // Accumulate the value
      storage[groupKey].push(item);
      return storage;
    }, {});
  }

  public setDocTitle(title?: string): void {
    if (title) {
      document.title = title;
    }
    else {
      document.title = 'Solo Player';
    }
  }

  public googleSearch(searchTerm: string): void {
    const encodedTerm = encodeURI(searchTerm);
    window.open('https://google.com/search?q=' + encodedTerm);
  }

  public fileToUrl(filePath: string): string {
    return 'file://' + filePath;
  }

  /**
   * Encodes characters not supported by the encodeURI method
   * but supported by the file system like: #
   * encodeURI does not encode queryString or hash values, that's why
   * this method has to be called before.
   */
  public preEncodeFilePath(value: string): string {
    return value.replace('#', '%23');
  }

  public getSmallFormFactor(): ISize {
    // Height set to 800 becomes 761 because 39px are probably for the title bar of the window
    // Width set to 450 becomes 434, so 16px are going somewhere
    return {
      height: 800,
      width: 450
    };
  }

  /**
   * Creates a ripple effect using the specified click event.
   * @param clickEvent A reference to the click event.
   */
  public showRippleEffect(clickEvent: any): void {
    // This class is declared in the styles.scss
    const rippleCssClass = 'sp-ripple';
    const targetElement = clickEvent.currentTarget;

    // console.log(
    //  `${clickEvent.clientX},
    //   ${targetElement.offsetLeft},
    //   ${clickEvent.offsetX},
    //   ${clickEvent.clientY},
    //   ${targetElement.offsetTop},
    //   ${clickEvent.offsetY}`);

    const ripple = document.createElement('span');
    const diameter = Math.max(targetElement.clientWidth, targetElement.clientHeight);
    const radius = diameter / 2;

    // This tries to place the center of the circle exactly where the click happened.
    // This logic works for table td elements, not sure if it will work on other element types.
    ripple.style.left = `${clickEvent.offsetX - radius}px`;
    ripple.style.top = `${clickEvent.offsetY - radius}px`;
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.classList.add(rippleCssClass);

    // Remove any existing ripple from the target
    const oldRipple = targetElement.getElementsByClassName(rippleCssClass)[0];
    if (oldRipple) {
      oldRipple.remove();
    }
    // Finally add the new ripple
    targetElement.appendChild(ripple);

    // Remove it
    // (not removing it causes issues with virtual scrolling since elements are recreated as you scroll
    // and when that happens the effect animation runs again)
    this.ngZone.runOutsideAngular(() => {
      // Allow the animation to run and then remove the effect element
      setTimeout(() => {
        // Make sure the element still exists
        if (targetElement) {
          try {
            targetElement.removeChild(ripple);
          }
          catch (ex) {
            this.log.warn('Error removing ripple element.', ex);
          }
        }
      }, 1000);
    });
  }
}
