import { Injectable } from '@angular/core';
import { LogLevel } from 'src/app/core/services/log/log.enum';
import { LogService } from 'src/app/core/services/log/log.service';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { LocalStorageKeys } from 'src/app/shared/services/local-storage/local-storage.enum';
import { LocalStorageService } from 'src/app/shared/services/local-storage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {

  constructor(
    private log: LogService,
    private db: DatabaseService,
    private storage: LocalStorageService,
    private options: DatabaseOptionsService) { }

  /**
   * Initializes the application.
   * Contains init routines needed for the application to work properly.
   * It returns a promise that resolves when all the app init logic is done.
   */
  public async initialize(): Promise<void> {
    const debugMode = this.storage.getByKey(LocalStorageKeys.DebugMode);
    if (debugMode) {
      this.log.level = LogLevel.Verbose;
    }
    else {
      this.log.level = LogLevel.Warning;
    }
    await this.db.initializeDatabase();
    await this.options.init();
  } 
}
