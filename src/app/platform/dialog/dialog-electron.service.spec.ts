import { TestBed } from '@angular/core/testing';

import { DialogElectronService } from './dialog-electron.service';

describe('DialogElectronService', () => {
  let service: DialogElectronService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DialogElectronService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
