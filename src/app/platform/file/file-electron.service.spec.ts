import { TestBed } from '@angular/core/testing';

import { FileElectronService } from './file-electron.service';

describe('FileNodeService', () => {
  let service: FileElectronService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileElectronService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
