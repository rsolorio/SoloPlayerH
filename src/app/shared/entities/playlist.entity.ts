import { Column, Entity } from "typeorm";
import { DbEntity } from "./base.entity";

@Entity({name: 'playlist'})
export class PlaylistEntity extends DbEntity {
  @Column({ nullable: true })
  description: string;
  @Column()
  favorite: boolean;
}
