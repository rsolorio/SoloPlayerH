import { TestBed } from '@angular/core/testing';

import { ListTransformService } from './list-transform.service';

describe('ListTransformService', () => {
  let service: ListTransformService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListTransformService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
