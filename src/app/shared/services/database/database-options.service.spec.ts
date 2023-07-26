import { TestBed } from '@angular/core/testing';

import { DatabaseOptionsService } from './database-options.service';

describe('DatabaseOptionsService', () => {
  let service: DatabaseOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseOptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
