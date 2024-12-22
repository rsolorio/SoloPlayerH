import { Injectable } from '@angular/core';
import { ModuleOptionEntity } from '../../entities';
import { DatabaseLookupService } from './database-lookup.service';
import { ValueEditorType } from 'src/app/core/models/core.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { cryptKey } from 'src/app/app-exports';

@Injectable({
  providedIn: 'root'
})
export class DatabaseOptionsService {
  private options: ModuleOptionEntity[];
  constructor(private lookup: DatabaseLookupService, private utility: UtilityService) { }

  public async init(): Promise<void> {
    this.options = await ModuleOptionEntity.find();
  }

  public getArray(id: string): string[] {
    const moduleOption = this.lookup.findModuleOption(id, this.options);
    if (moduleOption.valueEditorType !== ValueEditorType.Text) {
      // TODO:
    }
    return JSON.parse(moduleOption.values) as string[];
  }

  public getBoolean(id: string): boolean {
    const moduleOption = this.lookup.findModuleOption(id, this.options);
    if (moduleOption.valueEditorType !== ValueEditorType.YesNo) {
      // TODO:
    }
    return JSON.parse(moduleOption.values) as boolean;
  }

  public getText(id: string): string {
    const moduleOption = this.lookup.findModuleOption(id, this.options);
    if (moduleOption.valueEditorType !== ValueEditorType.YesNo) {
      // TODO:
    }
    if (moduleOption.values) {
      return JSON.parse(moduleOption.values) as string;
    }
    return null;
  }

  public getNumber(id: string): number {
    const moduleOption = this.lookup.findModuleOption(id, this.options);
    if (moduleOption.values) {
      const numericValue = JSON.parse(moduleOption.values) as number;
      if (!Number.isNaN(numericValue) && numericValue > 0) {
        return numericValue;
      }
    }
    return 0;
  }

  public getPassword(id: string): string {
    const moduleOption = this.lookup.findModuleOption(id, this.options);
    if (moduleOption.values) {
      const encryptedValue = JSON.parse(moduleOption.values) as string;
      return this.utility.decrypt(encryptedValue, cryptKey);
    }
    return null;
  }

  public async saveText(id: string, values: string[]): Promise<void> {
    const moduleOption = this.lookup.findModuleOption(id, this.options);
    if (moduleOption) {
      if (moduleOption.multipleValues) {
        moduleOption.values = JSON.stringify(values);
      }
      else {
        moduleOption.values = JSON.stringify(values[0]);
      }
      await moduleOption.save();
    }
  }

  public async savePassword(id: string, value: string): Promise<void> {
    const moduleOption = this.lookup.findModuleOption(id, this.options);
    moduleOption.values = JSON.stringify(this.utility.encrypt(value, cryptKey));
    await moduleOption.save();
  }

  public async saveBoolean(id: string, value: boolean): Promise<void> {
    const moduleOption = this.lookup.findModuleOption(id, this.options);
    if (moduleOption) {
      moduleOption.values = JSON.stringify(value);
      await moduleOption.save();
    }
  }

  public async saveNumber(id: string, value: number): Promise<void> {
    const moduleOption = this.lookup.findModuleOption(id, this.options);
    if (moduleOption) {
      moduleOption.values = JSON.stringify(value);
      await moduleOption.save();
    }
  }

  public async refreshOptionValues(id: string): Promise<void> {
    const dbModuleOption = await this.lookup.lookupModuleOption(id);
    if (dbModuleOption) {
      const cacheModuleOption = this.lookup.findModuleOption(id, this.options);
      if (cacheModuleOption) {
        cacheModuleOption.values = dbModuleOption.values;
      }
      else {
        this.options.push(dbModuleOption);
      }
    }
  }
}
