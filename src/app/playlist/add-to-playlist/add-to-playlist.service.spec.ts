import { TestBed } from '@angular/core/testing';

import { AddToPlaylistService } from './add-to-playlist.service';

describe('AddToPlaylistService', () => {
  let service: AddToPlaylistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddToPlaylistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
