import { ISongModel } from "src/app/shared/models/song-model.interface";
import { ListTransformValidatorBase } from "src/app/shared/services/list-transform/list-transform-validator.class";

/**
 * Validator that will allow to alternate items by the specified properties.
 * The validation returns true if the property values are different than the previous ones
 * which allows to alternate those properties while building the list.
 */
export class ValidatorAlternateProperties extends ListTransformValidatorBase<ISongModel> {

  private previousItem: any = {};

  protected get canBeReset(): boolean {
    return false;
  }

  /** Returns "true" if the item properties are different than the previous item; returns "false" otherwise. */
  protected innerValidate(item: any, properties: string[]): boolean {
    if (!properties.length) {
      throw new Error('Empty list of properties. This validation requires at least one property.');
    }

    let differentValues = false;
    for (let propertyIndex = 0; propertyIndex < properties.length; propertyIndex++) {
      const propertyName = properties[propertyIndex];
      if (this.previousItem[propertyName] !== item[propertyName]) {
        differentValues = true;
        this.previousItem[propertyName] = item[propertyName];
      }
    }
    return differentValues;
  }
}