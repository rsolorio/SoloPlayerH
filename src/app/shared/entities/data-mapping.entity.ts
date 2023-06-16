import { PrimaryColumn, Column, Entity, BaseEntity } from "typeorm";

@Entity({name: 'dataMapping'})
export class DataMappingEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;
  @Column()
  dataSourceId: string;
  @Column()
  source: string;
  @Column()
  destination: string;
  @Column()
  sequence: number;
  @Column()
  disabled: boolean;
  @Column()
  system: boolean;
}
