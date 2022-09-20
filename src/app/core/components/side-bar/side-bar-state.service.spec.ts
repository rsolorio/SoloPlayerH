import { TestBed } from '@angular/core/testing';

import { SideBarStateService } from './side-bar-state.service';

describe('SideBarStateService', () => {
  let service: SideBarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SideBarStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
