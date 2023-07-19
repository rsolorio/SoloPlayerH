import { TestBed } from '@angular/core/testing';

import { RelativeDateService } from './relative-date.service';

describe('RelativeDateService', () => {
  let service: RelativeDateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelativeDateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
