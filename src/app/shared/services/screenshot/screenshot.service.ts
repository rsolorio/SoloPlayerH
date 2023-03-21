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

  public download(elementId?: string, fileName?: string): void {
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
    html2canvas(screenshotTarget, options).then(canvas => {
      const dataUrl = canvas.toDataURL();
      // TODO: https://stackoverflow.com/questions/61250048/how-to-share-a-single-base64-url-image-via-the-web-share-api
      // fetchResponse.arrayBuffer().then(buffer => {
      //   const file = new File([buffer], 'hello.jpg', { type: 'image/jpeg' });
      // });
      fetch(dataUrl).then(fetchResponse => {
        fetchResponse.blob().then(blob => {
          const url = window.URL.createObjectURL(blob);
          this.utility.downloadUrl(url);
        });
      });
    });
  }

  public downloadDelay(delayMs: number, elementId?: string, fileName?: string): void {
    setTimeout(() => {
      this.download(elementId, fileName);
    }, delayMs);
  }
}
