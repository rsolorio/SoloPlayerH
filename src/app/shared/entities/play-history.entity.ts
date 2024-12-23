import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity({name: 'playHistory'})
export class PlayHistoryEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;
  @PrimaryColumn()
  playDate: Date;
  @Column()
  playCount: number;
  @Column()
  progress: number;
  @Column()
  scrobbled: boolean;
}
