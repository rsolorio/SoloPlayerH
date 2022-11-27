import { TestBed } from '@angular/core/testing';

import { SideBarHostStateService } from './side-bar-host-state.service';

describe('SideBarHostStateService', () => {
  let service: SideBarHostStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SideBarHostStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
