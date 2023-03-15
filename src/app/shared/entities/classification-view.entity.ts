import { ViewColumn, ViewEntity } from 'typeorm';
import { IClassificationModel } from '../models/classification-model.interface';
import { ListItemEntity } from './base.entity';
/**
 * A view that joins the valueListEntry table with the songClassification table.
 */
@ViewEntity({
  name: 'classificationView',
  expression: `
  SELECT classification.id, classification.name, valueListType.id AS classificationTypeId, valueListType.name AS classificationType, COUNT(classification.id) AS songCount
  FROM (SELECT id, name, valueListTypeId FROM valueListEntry WHERE isClassification = true) AS classification
  INNER JOIN valueListType
  ON classification.valueListTypeId = valueListType.id
  INNER JOIN songClassification
  ON classification.id = songClassification.classificationId
  GROUP BY classification.id
`
})
export class ClassificationViewEntity extends ListItemEntity implements IClassificationModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  classificationTypeId: string;
  @ViewColumn()
  classificationType: string;
}
