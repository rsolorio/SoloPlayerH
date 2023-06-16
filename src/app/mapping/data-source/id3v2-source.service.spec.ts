import { TestBed } from '@angular/core/testing';

import { Id3v2SourceService } from './id3v2-source.service';

describe('Id3v2SourceService', () => {
  let service: Id3v2SourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Id3v2SourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
