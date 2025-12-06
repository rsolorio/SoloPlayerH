import { PrimaryColumn, Column, Entity, BaseEntity } from "typeorm";

@Entity({name: 'dataMapping'})
export class DataMappingEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;
  @Column()
  dataSourceId: string;
  @Column({ nullable: true, comment: 'Expression that should return a list of values; each value will be processed using the source expression where you can refer to each value as %item%.' })
  iterator: string;
  @Column({ comment: 'Expression to retrieve data from a data source.' })
  source: string;
  @Column({ comment: 'The name of the field where the data will be inserted.' })
  destination: string;
  @Column({ nullable: true, comment: `List of string values separated by | which won't be mapped if found.` })
  ignore: string;
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
