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
  @Column({ comment: 'The data retrieval process will group the mappings by priority; if the highest priority group does not return a value it will move to the next group until a value is returned.' })
  priority: number;
  @Column({ comment: 'This is the sequence of mappings to be processed in a priority group.' })
  sequence: number;
  @Column()
  userDefined: boolean;
  @Column()
  disabled: boolean;
  @Column()
  system: boolean;
}
