import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity({name: 'filterCriteriaItem'})
export class FilterCriteriaItemEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;
  @Column()
  filterCriteriaId: string;
  @Column()
  columnName: string;
  @Column({ nullable: true })
  columnValue: string;
  @Column()
  comparison: number;
  @Column()
  valuesOperator: number;
  @Column()
  expressionOperator: number;
  @Column()
  sortDirection: number;
  @Column()
  sortSequence: number;
  @Column()
  ignoreInSelect: boolean;
  @Column()
  isRelativeDate: boolean;
  @Column()
  displayName: string;
  @Column()
  displayValue: string;
}
