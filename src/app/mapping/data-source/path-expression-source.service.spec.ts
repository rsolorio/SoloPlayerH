import { TestBed } from '@angular/core/testing';

import { PathExpressionSourceService } from './path-expression-source.service';

describe('PathExpressionSourceService', () => {
  let service: PathExpressionSourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PathExpressionSourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
