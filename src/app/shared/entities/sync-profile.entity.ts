import { Column, Entity } from "typeorm";
import { DbEntity } from "./base.entity";
import { dateTransformer } from "./date-transformer";
import { ISyncProfile } from "../models/sync-profile-model.interface";

@Entity({name: 'syncProfile'})
export class SyncProfileEntity extends DbEntity implements ISyncProfile {
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
  @Column({ nullable: true, transformer: dateTransformer })
  syncInfo: string;
  @Column()
  system: boolean;

  canBeRendered: boolean;
}
