import { TestBed } from '@angular/core/testing';

import { MusicMetadataService } from './music-metadata.service';

describe('MusicMetadataService', () => {
  let service: MusicMetadataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MusicMetadataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
