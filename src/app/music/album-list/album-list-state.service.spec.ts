import { TestBed } from '@angular/core/testing';

import { AlbumListStateService } from './album-list-state.service';

describe('AlbumListStateService', () => {
  let service: AlbumListStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlbumListStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
