import { IListItemModel } from './base-model.interface';

export interface IClassificationModel extends IListItemModel {
  classificationType: string;
  songCount: number;
}
