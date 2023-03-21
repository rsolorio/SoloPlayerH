import { Injectable } from '@angular/core';
import { DialogService } from './dialog.service';
import { dialog } from '@electron/remote';
import * as remoteRenderer from '@electron/remote/renderer';
import { IDialogOptions } from './dialog.interface';
import { ipcRenderer } from 'electron';
import { ISize } from 'src/app/core/models/core.interface';

declare let ImageCapture: any;

@Injectable({
  providedIn: 'root'
})
export class DialogElectronService extends DialogService {

  ipc: typeof ipcRenderer;

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  get electronApi(): any {
    const win = window as any;
    return win.electronApi;
  }

  constructor() {
    super();
    if (this.isElectron) {
      this.ipc = window.require('electron').ipcRenderer;
    }
  }

  openDevTools(): void {
    remoteRenderer.getCurrentWebContents().openDevTools();
  }

  resizeWindow(size: ISize): void {
    const currentWindow = remoteRenderer.getCurrentWindow();
    // When the window is maximized the resize does not take effect
    if (currentWindow.isMaximized()) {
      currentWindow.restore();
    }
    currentWindow.setBounds({
      width: size.width,
      height: size.height
    });
  }

  openFolderDialog(options?: IDialogOptions): string[] {
    const electronDialogOptions: Electron.OpenDialogSyncOptions = {};
    if (options) {
      electronDialogOptions.title = options.title;
    }
    electronDialogOptions.properties = ['openDirectory'];
    return dialog.showOpenDialogSync(remoteRenderer.getCurrentWindow(), electronDialogOptions);
  }

  openFileDialog(options?: IDialogOptions): string[] {
    const electronDialogOptions: Electron.OpenDialogSyncOptions = {};
    if (options) {
      electronDialogOptions.title = options.title;
    }
    electronDialogOptions.properties = ['openFile'];
    return dialog.showOpenDialogSync(remoteRenderer.getCurrentWindow(), electronDialogOptions);
  }

  async getScreenshot(): Promise<string> {
    // Allow to hide menu. This should not be here.
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.getScreenshotUsingVideo();
    //return this.getScreenshotUsingCapture();
  }

  private async getScreenshotUsingCapture(): Promise<string> {
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

  private async getScreenshotUsingVideo(): Promise<string> {
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
          resolve(canvas.toDataURL('image/jpeg'));
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
