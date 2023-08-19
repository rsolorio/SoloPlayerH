import { TestBed } from '@angular/core/testing';

import { SettingsViewStateService } from './settings-view-state.service';

describe('SettingsViewStateService', () => {
  let service: SettingsViewStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsViewStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
