import { Injectable } from '@angular/core';

import html2canvas from 'html2canvas';

/**
 * Provides methods to generate screenshots from html elements.
 * It is based on the html2canvas package: https://html2canvas.hertzen.com/
 * Features and unsupported properties can be found here: https://html2canvas.hertzen.com/features
 */
@Injectable({
  providedIn: 'root'
})
export class ScreenshotService {

  constructor() { }

  public download(elementId: string, fileName?: string): void {
    if (!fileName) {
      fileName = 'screenshot';
    }
    const screenshotTarget = document.getElementById(elementId);
    html2canvas(screenshotTarget).then(canvas => {
      const dataUrl = canvas.toDataURL();
      // TODO: https://stackoverflow.com/questions/61250048/how-to-share-a-single-base64-url-image-via-the-web-share-api
      // fetchResponse.arrayBuffer().then(buffer => {
      //   const file = new File([buffer], 'hello.jpg', { type: 'image/jpeg' });
      // });
      fetch(dataUrl).then(fetchResponse => {
        fetchResponse.blob().then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = fileName + '.jpg';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        });
      });
    });
  }
}
