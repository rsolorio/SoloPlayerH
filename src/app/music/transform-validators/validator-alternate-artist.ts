import { ISongModel } from "src/app/shared/models/song-model.interface";
import { ListTransformValidatorBase } from "src/app/shared/services/list-transform/list-transform-validator.class";

/**
 * Validator that will allow to alternate items by artist.
 * The validation returns true if the artist is different than the previous one
 * which allows to alternate artists while building the list.
 */
export class ValidatorAlternateArtist extends ListTransformValidatorBase<ISongModel> {

  private previousArtistIds: string[] = [];

  /** Returns "true" if the artist is different than the previous artist; returns "false" otherwise. */
  protected innerValidate(item: ISongModel): boolean {
    const artistId = item.artistId ? item.artistId : item.primaryArtistId;
    if (!this.previousArtistIds.includes(artistId)) {
      this.previousArtistIds.push(artistId);
      return true;
    }
    return false;
  }

  protected innerReset(): void {
    this.previousArtistIds = [];
  }
}