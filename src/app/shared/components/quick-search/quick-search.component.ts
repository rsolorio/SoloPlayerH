import { Component, OnInit } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppEvent } from '../../models/events.enum';

@Component({
  selector: 'sp-quick-search',
  templateUrl: './quick-search.component.html',
  styleUrls: ['./quick-search.component.scss']
})
export class QuickSearchComponent implements OnInit {

  public searchTerm = '';
  public placeholder: string;
  public favoritesSearchActive = false;

  constructor(private events: EventsService) { }

  public ngOnInit(): void {
    this.placeholder = `Search...`;
  }

  public onSearchClick(): void {
    this.search();
  }

  public onClearClick(): void {
    this.searchTerm = '';
    this.focus();
  }

  public focus(): void {
  }

  public onEnter(): void {
    this.search();
  }

  private search(): void {
    this.events.broadcast(AppEvent.QuickSearchFired, this.searchTerm);
  }
}
