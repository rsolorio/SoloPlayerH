import { TestBed } from '@angular/core/testing';

import { DatabaseEntitiesService } from './database-entities.service';

describe('DatabaseEntitiesService', () => {
  let service: DatabaseEntitiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseEntitiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
