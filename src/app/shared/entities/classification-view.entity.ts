import { ViewColumn, ViewEntity } from 'typeorm';
import { IClassificationModel } from '../models/classification-model.interface';
import { ListEntity } from './base.entity';
import { ClassificationEntity } from './classification.entity';

@ViewEntity({
  expression: ds => ds
    .createQueryBuilder(ClassificationEntity, 'classification')
    .innerJoin('classification.songs', 'song')
    .select('classification.id', 'id')
    .addSelect('classification.name', 'name')
    .addSelect('classification.classificationType', 'classificationType')
    .addSelect('COUNT(classification.id)', 'songCount')
    .groupBy('classification.id')
})
export class ClassificationViewEntity extends ListEntity implements IClassificationModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  classificationType: string;
}
