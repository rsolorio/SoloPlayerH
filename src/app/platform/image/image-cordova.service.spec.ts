import { TestBed } from '@angular/core/testing';

import { ImageCordovaService } from './image-cordova.service';

describe('ImageCordovaService', () => {
  let service: ImageCordovaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageCordovaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
