import { Component } from '@angular/core';
import { DatabaseService } from './shared/services/database/database.service';

@Component({
  selector: 'sol-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'SoloPlayerH';

  constructor(dbService: DatabaseService) {
    dbService.dataSource.initialize().then(ds => {
      console.log('Database initialized!');
    });
  }
}
