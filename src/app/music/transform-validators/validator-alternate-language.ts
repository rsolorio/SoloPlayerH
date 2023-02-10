import { ISongModel } from "src/app/shared/models/song-model.interface";
import { ListTransformValidatorBase } from "src/app/shared/services/list-transform/list-transform-validator.class";

export class ValidatorAlternateLanguage extends ListTransformValidatorBase<ISongModel> {

  private lastLanguage: string;

  protected get canBeReset(): boolean {
    return false;
  }

  protected innerValidate(item: ISongModel): boolean {
    var currentLanguage = item.language;

    if (this.lastLanguage !== currentLanguage) {
      this.lastLanguage = currentLanguage;
      return true;
    }
    return false;
  }
}