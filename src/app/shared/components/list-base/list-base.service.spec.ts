import { TestBed } from '@angular/core/testing';

import { ListBaseService } from './list-base.service';

describe('ListBaseService', () => {
  let service: ListBaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListBaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
