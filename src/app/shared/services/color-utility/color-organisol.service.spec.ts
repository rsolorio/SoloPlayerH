import { TestBed } from '@angular/core/testing';

import { ColorOrganisolService } from './color-organisol.service';

describe('ColorOrganisolService', () => {
  let service: ColorOrganisolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColorOrganisolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
