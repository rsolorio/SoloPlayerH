import { TestBed } from '@angular/core/testing';

import { DialogCordovaService } from './dialog-cordova.service';

describe('DialogCordovaService', () => {
  let service: DialogCordovaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DialogCordovaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
