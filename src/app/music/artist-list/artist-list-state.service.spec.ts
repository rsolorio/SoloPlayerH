import { TestBed } from '@angular/core/testing';

import { ArtistListStateService } from './artist-list-state.service';

describe('ArtistListStateService', () => {
  let service: ArtistListStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArtistListStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
