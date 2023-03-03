import { TestBed } from '@angular/core/testing';

import { ScreenshotService } from './screenshot.service';

describe('ScreenshotService', () => {
  let service: ScreenshotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScreenshotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
