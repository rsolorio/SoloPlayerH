import { TestBed } from '@angular/core/testing';

import { SideBarMenuStateService } from './side-bar-menu-state.service';

describe('SideBarMenuStateService', () => {
  let service: SideBarMenuStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SideBarMenuStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
