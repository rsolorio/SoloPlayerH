import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';

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
    this.electronApi.openDevTools();
  }

  openFolderDialog(options?: any): Promise<string[]> {
    return this.electronApi.openFolderDialog(options);
  }
}
