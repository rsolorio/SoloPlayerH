import { TestBed } from '@angular/core/testing';

import { DatabaseFiltersService } from './database-filters.service';

describe('DatabaseFiltersService', () => {
  let service: DatabaseFiltersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseFiltersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
