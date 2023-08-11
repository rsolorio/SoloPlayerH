import { ISongModel } from "src/app/shared/models/song-model.interface";
import { ListTransformValidatorBase } from "src/app/shared/services/list-transform/list-transform-validator.class";

/**
 * Validator that will allow to alternate items by artist.
 * The validation returns true if the artist is different than the previous one
 * which allows to alternate artists while building the list.
 */
export class ValidatorAlternateArtist extends ListTransformValidatorBase<ISongModel> {

  private previousArtistId: string;

  protected get canBeReset(): boolean {
    return false;
  }

  /** Returns "true" if the artist is different than the previous artist; returns "false" otherwise. */
  protected innerValidate(item: ISongModel): boolean {
    var currentArtistId = item.primaryArtistId;

    if (this.previousArtistId !== currentArtistId) {
      this.previousArtistId = currentArtistId;
      return true;
    }
    return false;
  }
}