import { Injectable } from '@angular/core';
import { AppRoute } from 'src/app/app-routes';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { INavigationInfo, INavigationOptions } from './navigation.interface';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  /**
   * The navigation history.
   * By default, the navigation starts with the Home route.
   */
  private history: INavigationInfo[] = [{ route: AppRoute.Home }]; // This first value must match the default route of your app.
  private maxRecords = 20;

  constructor(private utilities: UtilityService) { }

  public forward(route: string, options?: INavigationOptions): void {
    // Do not allow go to beyond the max
    if (this.history.length === this.maxRecords) {
      this.history.pop();
    }
    // Add it as the last route
    this.history.unshift({
      route: route,
      options: options
    });
    this.navigate(route, options);
  }

  public back(): void {
    if (this.history.length > 1) {
      // Remove the last route
      this.history.shift();
      // Now move the previous route
      const navInfo = this.history[0];
      this.navigate(navInfo.route, navInfo.options);
    }
  }

  public clear(): void {
    // Start with the latest item and remove everything else
    this.history = [this.history[0]];
  }

  public current(): INavigationInfo {
    return this.history[0];
  }

  public previous(): INavigationInfo {
    if (this.history.length > 1) {
      return this.history[1];
    }
    return null;
  }

  public routeChanged(): boolean {
    const previousNavInfo = this.previous();
    return previousNavInfo && previousNavInfo.route !== this.current().route;
  }

  private navigate(route: string, options?: INavigationOptions): void {
    if (options) {
      if (options.criteria) {
        this.utilities.navigateWithQueryParams(route, { queryId: options.criteria.id });
      }
      else if (options.routeParams) {
        this.utilities.navigateWithRouteParams(route, options.routeParams);
      }
    }
    else {
      this.utilities.navigate(route);
    }
  }
}
