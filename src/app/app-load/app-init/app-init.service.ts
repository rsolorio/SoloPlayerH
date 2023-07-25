import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogLevel } from 'src/app/core/services/log/log.enum';
import { LogService } from 'src/app/core/services/log/log.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {

  constructor(private events: EventsService, private log: LogService, private db: DatabaseService) { }

  /**
   * Initializes the application.
   * Contains init routines needed for the application to work properly.
   * It returns a promise that resolves when all the app init logic is done.
   */
  public async initialize(): Promise<void> {
    this.log.level = LogLevel.Warning;
    await this.db.initializeDatabase();
  } 
}
