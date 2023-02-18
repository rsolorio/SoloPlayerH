import { TestBed } from '@angular/core/testing';

import { ColorUtilityService } from './color-utility.service';

describe('ColorUtilityService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ColorUtilityService = TestBed.get(ColorUtilityService);
    expect(service).toBeTruthy();
  });
});
