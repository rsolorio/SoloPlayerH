import { TestBed } from '@angular/core/testing';

import { SongListBroadcastService } from './song-list-broadcast.service';

describe('SongListBroadcastService', () => {
  let service: SongListBroadcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SongListBroadcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
