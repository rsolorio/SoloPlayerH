import { TestBed } from '@angular/core/testing';

import { ImageUtilityService } from './image-utility.service';

describe('ImageUtilityService', () => {
  let service: ImageUtilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageUtilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
