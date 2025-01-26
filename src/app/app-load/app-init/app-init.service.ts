import { Injectable } from '@angular/core';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {

  constructor(
    private db: DatabaseService,
    private options: DatabaseOptionsService) { }

  /**
   * Initializes the application.
   * Contains init routines needed for the application to work properly.
   * It returns a promise that resolves when all the app init logic is done.
   */
  public async initialize(): Promise<void> {
    await this.db.initializeDatabase();
    await this.options.init();
  } 
}
