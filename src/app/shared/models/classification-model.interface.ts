import { IListModel } from './base-model.interface';

export interface IClassificationModel extends IListModel {
  classificationType: string;
  songCount: number;
}
