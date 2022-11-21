import { TestBed } from '@angular/core/testing';

import { PlayerOverlayStateService } from './player-overlay-state.service';

describe('PlayerOverlayStateService', () => {
  let service: PlayerOverlayStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlayerOverlayStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
