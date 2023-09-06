import { TestBed } from '@angular/core/testing';

import { MetadataNetWriterService } from './metadata-net-writer.service';

describe('MetadataNetWriterService', () => {
  let service: MetadataNetWriterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataNetWriterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
