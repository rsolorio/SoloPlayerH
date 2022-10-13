import { TestBed } from '@angular/core/testing';

import { ClassificationListStateService } from './classification-list-state.service';

describe('ClassificationListStateService', () => {
  let service: ClassificationListStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClassificationListStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
