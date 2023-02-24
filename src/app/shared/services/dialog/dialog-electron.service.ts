import { Injectable } from '@angular/core';
import { DialogService } from './dialog.service';
import { dialog } from '@electron/remote';
import * as remoteRenderer from '@electron/remote/renderer';
import { IDialogOptions } from './dialog.interface';
import { ipcRenderer } from 'electron';

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

  resizeWindow(height: number, width: number): void {
    const currentWindow = remoteRenderer.getCurrentWindow();
    // When the window is maximized the resize does not take effect
    if (currentWindow.isMaximized()) {
      currentWindow.restore();
    }
    currentWindow.setBounds({
      width: width,
      height: height
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
}
