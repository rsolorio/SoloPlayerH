import { TestBed } from '@angular/core/testing';

import { DatabaseSortingService } from './database-sorting.service';

describe('DatabaseSortingService', () => {
  let service: DatabaseSortingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseSortingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
