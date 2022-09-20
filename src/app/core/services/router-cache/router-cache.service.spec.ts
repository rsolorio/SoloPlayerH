import { TestBed } from '@angular/core/testing';

import { RouterCacheService } from './router-cache.service';

describe('RouterCacheService', () => {
  let service: RouterCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RouterCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
