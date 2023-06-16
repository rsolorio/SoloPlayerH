import { TestBed } from '@angular/core/testing';

import { MetadataReaderService } from './metadata-reader.service';

describe('MetadataReaderService', () => {
  let service: MetadataReaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataReaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
