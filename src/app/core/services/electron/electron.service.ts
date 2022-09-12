import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import { dialog } from '@electron/remote';
import * as remoteRenderer from '@electron/remote/renderer';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipc: typeof ipcRenderer;

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  get electronApi(): any {
    const win = window as any;
    return win.electronApi;
  }

  constructor() {
    if (this.isElectron) {
      this.ipc = window.require('electron').ipcRenderer;
    }
  }

  openDevTools(): void {
    remoteRenderer.getCurrentWebContents().openDevTools();
  }

  openDialog(): void {
    dialog.showOpenDialog(remoteRenderer.getCurrentWindow(), { properties: ['openDirectory']});
  }

  openFolderDialog(options?: any): Promise<string[]> {
    return this.electronApi.openFolderDialog(options);
  }
}
