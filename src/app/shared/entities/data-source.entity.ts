import { Column, Entity } from "typeorm";
import { DbEntity } from "./base.entity";

@Entity({name: 'dataSource'})
export class DataSourceEntity extends DbEntity {
  @Column()
  profileId: string;
  @Column()
  type: string;
  @Column({ nullable: true })
  config: string;
  @Column()
  customMapping: boolean;
  @Column({ nullable: true })
  attributes: string;
  @Column()
  sequence: number;
  @Column()
  disabled: boolean;
  @Column()
  system: boolean;
}
