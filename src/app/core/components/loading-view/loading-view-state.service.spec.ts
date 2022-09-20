import { TestBed } from '@angular/core/testing';

import { LoadingViewStateService } from './loading-view-state.service';

describe('LoadingViewStateService', () => {
  let service: LoadingViewStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingViewStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
