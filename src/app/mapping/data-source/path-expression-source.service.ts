import { Injectable } from '@angular/core';
import { IDataSource, ILoadInfo } from './data-source.interface';

@Injectable({
  providedIn: 'root'
})
export class PathExpressionSourceService implements IDataSource {

  constructor() { }

  public async load(info: ILoadInfo): Promise<ILoadInfo> {
    return info;
  }

  public async get(propertyName: string): Promise<any[]> {
    return null;
  }
}
