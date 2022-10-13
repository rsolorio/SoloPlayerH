import { TestBed } from '@angular/core/testing';

import { ClassificationListBroadcastService } from './classification-list-broadcast.service';

describe('ClassificationListBroadcastService', () => {
  let service: ClassificationListBroadcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClassificationListBroadcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
