import { Injectable } from '@angular/core';
import { ImageService } from './image.service';
import { IImage } from 'src/app/core/models/core.interface';
import { NativeImage, nativeImage } from 'electron';
import { ImageSrcType, MimeType } from 'src/app/core/models/core.enum';
import * as remoteRenderer from '@electron/remote/renderer';
import { FileService } from '../file/file.service';
import { AudioMetadataService } from '../audio-metadata/audio-metadata.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

declare let ImageCapture: any;

@Injectable({
  providedIn: 'root'
})
export class ImageElectronService extends ImageService {

  constructor(private fileService: FileService, private metadataService: AudioMetadataService, private utility: UtilityService) {
    super(fileService, metadataService, utility);
  }

  public async shrinkImage(image: IImage, size: number): Promise<string> {
    let imageObj: NativeImage;
    if (image.srcType === ImageSrcType.DataUrl) {
      imageObj = nativeImage.createFromDataURL(image.src);
    }
    else if (image.srcType === ImageSrcType.FileUrl) {
      // Remove the text: file://
      const filePath = image.src.slice(7);
      imageObj = nativeImage.createFromPath(filePath);
    }

    if (!imageObj) {
      return null;
    }

    const currentSize = imageObj.getSize();
    const newSize = this.shrink({ width: currentSize.width, height: currentSize.height }, size);
    if (!newSize) {
      return null;
    }

    return imageObj.resize({ width: newSize.width, height: newSize.height }).toDataURL();
  }

  public async getScreenshot(delayMs?: number): Promise<string> {
    // Allow to hide menu. This should not be here.
    if (delayMs) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    //return this.getScreenshotUsingVideo();
    //return this.getScreenshotUsingCapture();
    return this.getScreenshotWithWebContents();
  }

  private async getScreenshotWithWebContents(): Promise<string> {
    const webContents = remoteRenderer.getCurrentWebContents();
    const page = await webContents.capturePage({ x: 0, y:0, width: window.innerWidth, height: window.innerHeight - 1 });
    return `data:${MimeType.Jpg};base64,` + page.toJPEG(100).toString('base64');
  }

  private async getScreenshotWithImageCapture(): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      const mediaSourceId = remoteRenderer.getCurrentWindow().getMediaSourceId();
      try {
        const constraints: any = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: mediaSourceId,
              minWidth: window.innerWidth,
              maxWidth: window.innerWidth,
              minHeight: window.innerHeight - 1,
              maxHeight: window.innerHeight - 1
            }
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const mediaStreamTrack = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(mediaStreamTrack);
        // https://github.com/GoogleChromeLabs/imagecapture-polyfill/issues/15
        //const blob = await imageCapture.takePhoto();
        const frame = await imageCapture.grabFrame();
        const bitmap = frame as ImageBitmap;
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('bitmaprenderer');
        ctx.transferFromImageBitmap(bitmap);
        canvas.toBlob(blob => {
          resolve(window.URL.createObjectURL(blob));
        });
      }
      catch (e) {
        reject(e);
      }
    });
  }

  private async getScreenshotWithVideo(): Promise<string> {
    // Based on: https://ourcodeworld.com/articles/read/280/creating-screenshots-of-your-app-or-the-screen-in-electron-framework
    // I found this issue: https://github.com/electron/electron/issues/29931
    return new Promise<string>(async (resolve, reject) => {
      const mediaSourceId = remoteRenderer.getCurrentWindow().getMediaSourceId();
      // const result = await ipcRenderer.invoke('getSourceStream', mediaSourceId);
      try {
        const constraints: any = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: mediaSourceId,
              minWidth: window.innerWidth,
              maxWidth: window.innerWidth,
              minHeight: window.innerHeight - 1,
              maxHeight: window.innerHeight - 1
            }
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        const video = document.createElement('video');
        video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';
        video.onloadedmetadata = () => {
          video.style.height = video.videoHeight + 'px'; // videoHeight
          video.style.width = video.videoWidth + 'px'; // videoWidth
          video.play();
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          video.remove();
          try {
            stream.getTracks()[0].stop();
          }
          catch {
            //
          }
          resolve(canvas.toDataURL(MimeType.Jpg));
        };

        video.srcObject = stream;
        document.body.appendChild(video);
      }
      catch (e) {
        reject(e);
      }
    });
  }
}
