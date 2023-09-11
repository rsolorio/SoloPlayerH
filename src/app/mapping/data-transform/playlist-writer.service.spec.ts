import { TestBed } from '@angular/core/testing';

import { PlaylistWriterService } from './playlist-writer.service';

describe('PlaylistWriterService', () => {
  let service: PlaylistWriterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaylistWriterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
