import { ISongModel } from "src/app/shared/models/song-model.interface";
import { ListTransformValidatorBase } from "src/app/shared/services/list-transform/list-transform-validator.class";

/**
 * Validator that will allow to alternate items by language.
 * The validation returns true if the language is different than the previous one
 * which allows to alternate languages while building the list.
 */
export class ValidatorAlternateLanguage extends ListTransformValidatorBase<ISongModel> {

  private previousLanguage: string;

  protected get canBeReset(): boolean {
    return false;
  }

  /** Returns "true" if the language is different than the previous language; returns "false" otherwise. */
  protected innerValidate(item: ISongModel): boolean {
    var currentLanguage = item.language;

    // TODO: validate against a list of languages (like the artist validator) instead of just one
    if (this.previousLanguage !== currentLanguage) {
      this.previousLanguage = currentLanguage;
      return true;
    }
    return false;
  }
}