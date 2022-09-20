import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
/**
 * This service is meant to be used as a communication channel between the navigate method and a route resolver.
 * If you need to pass data to a particular route you will need to implement a route resolver; pass the data
 * from your code to this service, when the resolver is activated it will grab the data from this service and pass
 * it to the new route.
 */
export class RouterCacheService {

  private param: any;
  constructor() { }

  /**
   * Saves the specified param in the service for later use.
   */
  public set(routeParam: any): void {
    this.param = routeParam;
  }

  /**
   * Gets the param stored in the service.
   */
  public get(): any {
    const result = this.param;
    this.param = null;
    return result;
  }
}
