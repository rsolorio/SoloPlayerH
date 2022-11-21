import { TestBed } from '@angular/core/testing';

import { HtmlPlayerService } from './html-player.service';

describe('HtmlPlayerService', () => {
  let service: HtmlPlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HtmlPlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
