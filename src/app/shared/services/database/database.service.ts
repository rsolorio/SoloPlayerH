import { Injectable } from '@angular/core';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Song } from '../../models/song.entity';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  public dataSource: DataSource;
  constructor() {
    const options: DataSourceOptions = {
      type: 'sqlite',
      database: 'solo-player.db',
      entities: [ Song ],
      synchronize: true,
      logging: 'all'
    };
    this.dataSource = new DataSource(options);
  }
}
