import { Injectable } from '@angular/core';
import { IDataSource, ILoadInfo } from './data-source.interface';

@Injectable({
  providedIn: 'root'
})
export class PathExpressionSourceService implements IDataSource {

  constructor() { }

  public async load(info: ILoadInfo): Promise<void> {
  }

  public get(propertyName: string): any[] {
    return null;
  }
}
