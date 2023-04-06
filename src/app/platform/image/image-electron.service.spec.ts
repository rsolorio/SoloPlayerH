import { TestBed } from '@angular/core/testing';

import { ImageElectronService } from './image-electron.service';

describe('ImageElectronService', () => {
  let service: ImageElectronService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageElectronService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
