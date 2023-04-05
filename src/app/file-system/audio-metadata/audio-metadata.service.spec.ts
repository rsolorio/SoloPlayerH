import { TestBed } from '@angular/core/testing';

import { AudioMetadataService } from './audio-metadata.service';

describe('AudioMetadataService', () => {
  let service: AudioMetadataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioMetadataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
