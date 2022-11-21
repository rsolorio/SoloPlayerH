import { TestBed } from '@angular/core/testing';

import { PlaylistListBroadcastService } from './playlist-list-broadcast.service';

describe('PlaylistListBroadcastService', () => {
  let service: PlaylistListBroadcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaylistListBroadcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
