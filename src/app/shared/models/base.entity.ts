import { BaseEntity, PrimaryColumn, Column } from 'typeorm';

export class IdEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;
}

export class IdNameEntity extends IdEntity {
  @Column()
  name: string;
}
