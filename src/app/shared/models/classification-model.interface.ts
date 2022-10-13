import { IDbModel } from './base-model.interface';

export interface IClassificationModel extends IDbModel {
  classificationType: string;
  songCount: number;
  imageSrc: string;
  canBeRendered: boolean;
}
