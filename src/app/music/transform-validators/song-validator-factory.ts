import { CriteriaTransformAlgorithm } from "src/app/shared/services/criteria/criteria.enum";
import { ITransformValidatorFactory, IValidatorInfo } from "src/app/shared/services/list-transform/list-transform.interface";
import { ValidatorAlternateArtist } from "./validator-alternate-artist";
import { ValidatorAlternateLanguage } from "./validator-alternate-language";

export class SongValidatorFactory implements ITransformValidatorFactory {
  public get(algorithm: CriteriaTransformAlgorithm): IValidatorInfo {
    switch (algorithm) {
      case CriteriaTransformAlgorithm.ShuffleArtist:
        return {
          validator: new ValidatorAlternateArtist(),
          algorithm: algorithm
        };
      case CriteriaTransformAlgorithm.ShuffleLanguage:
        return {
          validator: new ValidatorAlternateLanguage(),
          algorithm: algorithm
        };
    }
    return null;
  }
}