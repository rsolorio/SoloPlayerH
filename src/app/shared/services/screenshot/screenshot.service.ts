import { Injectable } from '@angular/core';

import html2canvas, { Options } from 'html2canvas';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

/**
 * Provides methods to generate screenshots from html elements.
 * It is based on the html2canvas package: https://html2canvas.hertzen.com/
 * Features and unsupported properties can be found here: https://html2canvas.hertzen.com/features
 */
@Injectable({
  providedIn: 'root'
})
export class ScreenshotService {

  constructor(private utility: UtilityService) { }

  public async get(delayMs?: number, elementId?: string): Promise<string> {
    if (delayMs) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    let screenshotTarget = document.body;
    let options: Partial<Options> = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };
    if (elementId) {
      screenshotTarget = document.getElementById(elementId);
      options = undefined;
    }
    const canvas = await html2canvas(screenshotTarget, options);
    return canvas.toDataURL();
    //const dataUrl = canvas.toDataURL();
    //const fetchResponse = await fetch(dataUrl);
    //const blob = await fetchResponse.blob();
  }
}
