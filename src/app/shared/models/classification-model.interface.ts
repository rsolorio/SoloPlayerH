import { IListItemModel } from './base-model.interface';

export interface IClassificationModel extends IListItemModel {
  classificationTypeId: string;
  classificationType: string;
  songCount: number;
}
