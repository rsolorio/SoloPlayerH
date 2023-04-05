import { TestBed } from '@angular/core/testing';

import { ImagePreviewService } from './image-preview.service';

describe('ImagePreviewService', () => {
  let service: ImagePreviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImagePreviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
