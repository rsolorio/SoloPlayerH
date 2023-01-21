import { TestBed } from '@angular/core/testing';

import { BreadcrumbsStateService } from './breadcrumbs-state.service';

describe('BreadcrumbsStateService', () => {
  let service: BreadcrumbsStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BreadcrumbsStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
