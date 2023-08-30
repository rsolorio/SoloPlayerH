import { TestBed } from '@angular/core/testing';

import { SongModelSourceService } from './song-model-source.service';

describe('SongModelSourceService', () => {
  let service: SongModelSourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SongModelSourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
