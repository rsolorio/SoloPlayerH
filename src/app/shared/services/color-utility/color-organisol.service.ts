import { Injectable } from '@angular/core';
import { ColorExtractorName } from 'src/app/core/models/color-extractor-factory.class';
import { ColorServiceBase } from './color-service-base.class';
import { ColorServiceName } from './color-utility.interface';

@Injectable({
  providedIn: 'root'
})
export class ColorOrganisolService extends ColorServiceBase {
  constructor() {
    super();
  }

  public get name(): ColorServiceName {
    return ColorServiceName.Organisol;
  }

  public get extractorName(): ColorExtractorName {
    return ColorExtractorName.Organisol;
  }
}