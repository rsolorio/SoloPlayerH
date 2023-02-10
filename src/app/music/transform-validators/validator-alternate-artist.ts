import { ISongModel } from "src/app/shared/models/song-model.interface";
import { ListTransformValidatorBase } from "src/app/shared/services/list-transform/list-transform-validator.class";

export class ValidatorAlternateArtist extends ListTransformValidatorBase<ISongModel> {

  private lastArtistId: string;

  protected get canBeReset(): boolean {
    return false;
  }

  protected innerValidate(item: ISongModel): boolean {
    var currentArtistId = item.primaryArtistId;

    if (this.lastArtistId !== currentArtistId) {
      this.lastArtistId = currentArtistId;
      return true;
    }
    return false;
  }
}