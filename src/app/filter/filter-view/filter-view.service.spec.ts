import { TestBed } from '@angular/core/testing';

import { FilterViewService } from './filter-view.service';

describe('FilterViewService', () => {
  let service: FilterViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
