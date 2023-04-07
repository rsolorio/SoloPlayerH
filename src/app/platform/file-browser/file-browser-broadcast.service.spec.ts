import { TestBed } from '@angular/core/testing';

import { FileBrowserBroadcastService } from './file-browser-broadcast.service';

describe('FileBrowserBroadcastService', () => {
  let service: FileBrowserBroadcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileBrowserBroadcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
