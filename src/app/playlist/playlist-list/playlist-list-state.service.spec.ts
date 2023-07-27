import { TestBed } from '@angular/core/testing';

import { PlaylistListStateService } from './playlist-list-state.service';

describe('PlaylistListStateService', () => {
  let service: PlaylistListStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaylistListStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
