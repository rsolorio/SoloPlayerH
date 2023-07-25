import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity({name: 'filterCriteria'})
export class FilterCriteriaEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;
  @Column()
  distinct: boolean;
  @Column()
  limit: number;
  @Column()
  random: boolean;
}
