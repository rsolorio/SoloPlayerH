import { Column, Entity } from "typeorm";
import { DbEntity } from "./base.entity";

@Entity({name: 'dataSource'})
export class DataSourceEntity extends DbEntity {
  @Column()
  type: string;
  @Column({ nullable: true })
  config: string;
  @Column()
  system: boolean;
}
