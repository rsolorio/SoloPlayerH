import { BaseEntity, Entity, PrimaryColumn } from "typeorm";

@Entity({name: 'playHistory'})
export class PlayHistoryEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;
  @PrimaryColumn()
  playDate: Date;
}
