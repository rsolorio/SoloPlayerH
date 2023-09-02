import { TestBed } from '@angular/core/testing';

import { FunctionDefinitionService } from './function-definition.service';

describe('FunctionDefinitionService', () => {
  let service: FunctionDefinitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FunctionDefinitionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
