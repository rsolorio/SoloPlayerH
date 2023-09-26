import { Column, Entity } from "typeorm";
import { DbEntity } from "./base.entity";

@Entity({name: 'syncProfile'})
export class SyncProfileEntity extends DbEntity {
  @Column()
  syncType: string;
  @Column({ nullable: true })
  description: string;
  @Column({ nullable: true })
  directories: string;
  @Column({ nullable: true })
  config: string;
  @Column({ nullable: true })
  syncDate: Date;
  @Column({ nullable: true })
  syncInfo: string;
  @Column()
  defaultProfile: boolean;
  @Column()
  system: boolean;
}
