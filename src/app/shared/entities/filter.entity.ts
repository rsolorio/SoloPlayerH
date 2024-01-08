import { Column, Entity } from "typeorm";
import { ListItemEntity } from "./base.entity";
import { IFilterModel } from "../models/filter-model.interface";
import { dateTransformer } from "./date-transformer";

@Entity({name: 'filter'})
export class FilterEntity extends ListItemEntity implements IFilterModel {
  @Column({ nullable: true })
  description: string;
  @Column()
  filterCriteriaId: string;
  @Column()
  transformAlgorithm: number;
  @Column()
  favorite: boolean;
  @Column()
  filterTypeId: string;
  @Column()
  target: string;
  @Column({ nullable: true, transformer: dateTransformer })
  accessDate: Date;
  @Column()
  sync: boolean;
}
