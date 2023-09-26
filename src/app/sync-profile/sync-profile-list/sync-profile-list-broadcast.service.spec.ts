import { TestBed } from '@angular/core/testing';

import { SyncProfileListBroadcastService } from './sync-profile-list-broadcast.service';

describe('SyncProfileListBroadcastService', () => {
  let service: SyncProfileListBroadcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SyncProfileListBroadcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
