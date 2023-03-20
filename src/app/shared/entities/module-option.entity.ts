import { Column, Entity } from "typeorm";
import { IModuleOptionModel } from "../models/module-option-model.interface";
import { ListItemEntity } from "./base.entity";

@Entity({name: 'moduleOption'})
export class ModuleOptionEntity extends ListItemEntity implements IModuleOptionModel {
  @Column()
  moduleName: string;
  @Column()
  title: string;
  @Column({ nullable: true })
  description: string;
  @Column()
  valueEditorType: string;
  @Column()
  multipleValues: boolean;
  @Column({ nullable: true })
  valueListTypeId: string;
  @Column()
  system: boolean;
  @Column()
  values: string;
}
