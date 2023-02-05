import { TestBed } from '@angular/core/testing';

import { ChipSelectionService } from './chip-selection.service';

describe('ChipSelectionService', () => {
  let service: ChipSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChipSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
