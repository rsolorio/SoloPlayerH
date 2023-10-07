import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { IEvent } from './events.interface';
import { filter, map } from 'rxjs/operators';
import { CoreEvent } from 'src/app/app-events';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  /**
   * This property represents an observable as well as an observer.
   * The observer is used by this service to push data to the consumer.
   * The observable allows the consumer to subscribe and receive that data.
   */
  private eventList: Subject<IEvent>;
  constructor() {
    this.eventList = new Subject<IEvent>();
  }

  /**
   * Pushes a message.
   * @param key The event key that represents the message.
   * @param data The data to be included in the message.
   */
  public broadcast<T>(key: CoreEvent | string, data?: T): void {
    this.eventList.next({ key, data });
  }

  /**
   * The event that will be triggered when a message is broadcasted.
   * This wil return an observable with the message data.
   * @param key The key of the event waiting to be triggered.
   */
  public onEvent<T>(key: CoreEvent | string): Observable<T> {
    return this.eventList.asObservable().pipe(
      filter(event => event.key === key),
      map(event => event.data as T)
    );
  }

  /**
   * The list of events that will be triggered when messages are broadcasted.
   * This will return an observable with the event information.
   * @param keys A list of event keys waiting to be triggered.
   */
  public onEvents<T>(keys: string[]): Observable<IEvent> {
    return this.eventList.asObservable().pipe(
      filter(event => keys.indexOf(event.key) > -1)
    );
  }
}
