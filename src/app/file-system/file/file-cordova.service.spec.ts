import { TestBed } from '@angular/core/testing';

import { FileCordovaService } from './file-cordova.service';

describe('FileCordovaService', () => {
  let service: FileCordovaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileCordovaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
