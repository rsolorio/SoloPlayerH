import { Injectable } from '@angular/core';
import { ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { IFilter } from './filter-view.interface';

@Injectable({
  providedIn: 'root'
})
export class FilterViewService {

  constructor() { }

  create(name: string, systemCriteria: ICriteriaValueBaseModel[], breadcrumbCriteria: ICriteriaValueBaseModel[], userCriteria: ICriteriaValueBaseModel[]): IFilter {
    return null;
  }

  getCriteria(filter: IFilter): ICriteriaValueBaseModel[] {
    return null;
  }
}
