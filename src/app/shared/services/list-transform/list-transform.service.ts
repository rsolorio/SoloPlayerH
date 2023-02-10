import { Injectable } from '@angular/core';
import { CriteriaTransformAlgorithm } from '../criteria/criteria.enum';
import { IListTransformValidator, ITransformValidatorFactory, IValidatorInfo } from './list-transform.interface';

/**
 * The transform() method will need a list of validator types as input, a validator will
 * be created based on that input.
 */
@Injectable({
  providedIn: 'root'
})
export class ListTransformService {

  private factories: ITransformValidatorFactory[] = [];
  constructor() { }

  public register(factory: ITransformValidatorFactory): void {
    this.factories.push(factory);
  }

  public transform<T>(items: T[], algorithm: CriteriaTransformAlgorithm): T[] {
    const validatorInfo = this.findValidator(algorithm);
    if (!validatorInfo) {
      // If nothing found return the same input
      return items;
    }

    const includedItems: T[] = [];
    const excludedItems = [...items];
    let validItem = this.lookupItem(excludedItems, validatorInfo.validator);

    while (validItem) {
      excludedItems.splice(excludedItems.indexOf(validItem), 1);
      includedItems.push(validItem);
      validItem = this.lookupItem(excludedItems, validatorInfo.validator);

      if (!validItem) {
        // Try to reset the validator
        validatorInfo.validator.reset();
        // Try to see if we get a new item after the reset
        validItem = this.lookupItem(excludedItems, validatorInfo.validator);
      }
    }

    return includedItems;
  }

  private findValidator(algorithm: CriteriaTransformAlgorithm): IValidatorInfo {
    if (algorithm === CriteriaTransformAlgorithm.None) {
      return null;
    }
    for (const factory of this.factories) {
      const result = factory.get(algorithm);
      if (result) {
        return result;
      }
    }
    return null;
  }

  private lookupItem<T>(items: T[], validator: IListTransformValidator): T {
    for (const item of items) {
      if (validator.validate(item)) {
        return item;
      }
    }
    return null;
  }
}
