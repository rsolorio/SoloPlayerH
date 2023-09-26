import { TestBed } from '@angular/core/testing';

import { ScanPlaylistsService } from './scan-playlists.service';

describe('ScanPlaylistsService', () => {
  let service: ScanPlaylistsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScanPlaylistsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
