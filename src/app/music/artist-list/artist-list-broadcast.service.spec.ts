import { TestBed } from '@angular/core/testing';

import { ArtistListBroadcastService } from './artist-list-broadcast.service';

describe('ArtistListBroadcastService', () => {
  let service: ArtistListBroadcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArtistListBroadcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
