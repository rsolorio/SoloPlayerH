import { TestBed } from '@angular/core/testing';

import { DatabaseLookupService } from './database-lookup.service';

describe('DatabaseLookupService', () => {
  let service: DatabaseLookupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseLookupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
