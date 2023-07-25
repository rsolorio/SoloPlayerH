import { TestBed } from '@angular/core/testing';

import { FilterListBroadcastService } from './filter-list-broadcast.service';

describe('FilterListBroadcastService', () => {
  let service: FilterListBroadcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterListBroadcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
