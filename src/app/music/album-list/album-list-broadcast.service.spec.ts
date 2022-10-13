import { TestBed } from '@angular/core/testing';

import { AlbumListBroadcastService } from './album-list-broadcast.service';

describe('AlbumListBroadcastService', () => {
  let service: AlbumListBroadcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlbumListBroadcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
