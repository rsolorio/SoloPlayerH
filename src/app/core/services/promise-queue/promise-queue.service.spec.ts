import { TestBed } from '@angular/core/testing';

import { PromiseQueueService } from './promise-queue.service';

describe('PromiseQueueService', () => {
  let service: PromiseQueueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PromiseQueueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
