import { TestBed } from '@angular/core/testing';

import { MusicBreadcrumbsStateService } from './music-breadcrumbs-state.service';

describe('MusicBreadcrumbsStateService', () => {
  let service: MusicBreadcrumbsStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MusicBreadcrumbsStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
