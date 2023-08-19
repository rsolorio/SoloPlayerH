import { TestBed } from '@angular/core/testing';

import { ScanAudioService } from './scan-audio.service';

describe('ScanAudioService', () => {
  let service: ScanAudioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScanAudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
