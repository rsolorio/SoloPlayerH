import { TestBed } from '@angular/core/testing';

import { MetadataWriterService } from './metadata-writer.service';

describe('MetadataWriterService', () => {
  let service: MetadataWriterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataWriterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
