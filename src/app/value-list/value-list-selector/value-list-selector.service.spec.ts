import { TestBed } from '@angular/core/testing';

import { ValueListSelectorService } from './value-list-selector.service';

describe('ValueListSelectorService', () => {
  let service: ValueListSelectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValueListSelectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
