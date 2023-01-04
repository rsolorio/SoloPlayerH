import { ViewColumn, ViewEntity } from 'typeorm';
import { IClassificationModel } from '../models/classification-model.interface';
import { ListItemEntity } from './base.entity';
import { ClassificationEntity } from './classification.entity';

@ViewEntity({
  name: 'classificationView',
  expression: ds => ds
    .createQueryBuilder(ClassificationEntity, 'classification')
    .innerJoin('classification.songClassifications', 'songClassification')
    .innerJoin('songClassification.song', 'song')
    .select('classification.id', 'id')
    .addSelect('classification.name', 'name')
    .addSelect('classification.classificationType', 'classificationType')
    .addSelect('COUNT(classification.id)', 'songCount')
    .groupBy('classification.id')
})
export class ClassificationViewEntity extends ListItemEntity implements IClassificationModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  classificationType: string;
}
