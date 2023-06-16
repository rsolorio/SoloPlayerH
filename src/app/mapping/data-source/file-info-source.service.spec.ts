import { TestBed } from '@angular/core/testing';

import { FileInfoSourceService } from './file-info-source.service';

describe('FileInfoSourceService', () => {
  let service: FileInfoSourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileInfoSourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
