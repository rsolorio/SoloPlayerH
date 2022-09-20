import { TestBed } from '@angular/core/testing';

import { NavBarStateService } from './nav-bar-state.service';

describe('NavBarStateService', () => {
  let service: NavBarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavBarStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
