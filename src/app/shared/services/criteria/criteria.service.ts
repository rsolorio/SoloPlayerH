import { Injectable } from '@angular/core';
import { Criteria } from './criteria.class';

@Injectable({
  providedIn: 'root'
})
export class CriteriaService {

  private criteriaList: { [id: string]: Criteria } = {};

  constructor() { }
}
