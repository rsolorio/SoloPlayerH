import { PrimaryColumn, Column, Entity, BaseEntity } from "typeorm";

/**
 * Mappings allow to create new ways of associating metadata to data outputs.
 * Examples:
 * 1- The app has hardcoded logic that defines how (or from where) the data of an attribute will be retrieved;
 * a mapping allows to override that logic and determine how (field, expression, harcoded text, etc) the data will be retrieved using the "source" property.
 * 1a. This means all regular mappings use the "destination" property to specify the name of the attribute being overridden.
 * 1b. Regular mappings are only used when source attributes are being populated, which happens when those attributes are specified in the source attribute list.
 * 2- Once all attributes are populated with data, there's default logic that supports moving certain attributes to supported audio tags;
 * however, a user defined mapping allows to retrieve data and save it in a custom tag (not supported by default).
 * 2a. this means all user defined mappings will never have "destination" properties that match an existing attribute.
 * 2b. User defined mappings are always processed regardless of existing in the source attributes or not.
 * 3. To sum up:
 * a destination in a regular mapping is the name of a supported attribute (that some times matches a real audio tag);
 * a destination in a user defined mapping is the name of a custom audio tag;
 * the source for both are expressions applied to a given source to get the data.
 */
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
