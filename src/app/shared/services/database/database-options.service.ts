import { Injectable } from '@angular/core';
import { ModuleOptionEntity } from '../../entities';
import { DatabaseLookupService } from './database-lookup.service';
import { ModuleOptionEditor, ModuleOptionName } from '../../models/module-option.enum';

@Injectable({
  providedIn: 'root'
})
export class DatabaseOptionsService {
  private options: ModuleOptionEntity[];
  constructor(private lookup: DatabaseLookupService) { }

  public async init(): Promise<void> {
    this.options = await ModuleOptionEntity.find();
  }

  public getArray(moduleOptionName: string): string[] {
    const moduleOption = this.lookup.findModuleOption(moduleOptionName, this.options);
    if (moduleOption.valueEditorType !== ModuleOptionEditor.Text) {
      // TODO:
    }
    return JSON.parse(moduleOption.values) as string[];
  }

  public getBoolean(moduleOptionName: string): boolean {
    const moduleOption = this.lookup.findModuleOption(moduleOptionName, this.options);
    if (moduleOption.valueEditorType !== ModuleOptionEditor.YesNo) {
      // TODO:
    }
    return JSON.parse(moduleOption.values) as boolean;
  }

  public getText(moduleOptionName: string): string {
    const moduleOption = this.lookup.findModuleOption(moduleOptionName, this.options);
    if (moduleOption.valueEditorType !== ModuleOptionEditor.YesNo) {
      // TODO:
    }
    if (moduleOption.values) {
      return JSON.parse(moduleOption.values) as string;
    }
    return null;
  }

  public getNumber(moduleOptionName: string): number {
    const moduleOption = this.lookup.findModuleOption(moduleOptionName, this.options);
    if (moduleOption.values) {
      const numericValue = JSON.parse(moduleOption.values) as number;
      if (!Number.isNaN(numericValue) && numericValue > 0) {
        return numericValue;
      }
    }
    return 0;
  }

  public async saveText(name: ModuleOptionName, values: string[]): Promise<void> {
    const moduleOption = this.lookup.findModuleOption(name, this.options);
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
}
