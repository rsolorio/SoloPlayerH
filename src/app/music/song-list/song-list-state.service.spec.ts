import { TestBed } from '@angular/core/testing';

import { SongListStateService } from './song-list-state.service';

describe('SongListStateService', () => {
  let service: SongListStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SongListStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
