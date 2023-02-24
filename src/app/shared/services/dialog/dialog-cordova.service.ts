import { Injectable } from '@angular/core';
import { IDialogOptions } from './dialog.interface';
import { DialogService } from './dialog.service';

@Injectable({
  providedIn: 'root'
})
export class DialogCordovaService extends DialogService {

  constructor() {
    super();
  }

  openDevTools(): void {
  }

  openFolderDialog(options?: IDialogOptions): string[] {
    return [];
  }

  openFileDialog(options?: IDialogOptions): string[] {
    return [];
  }

  resizeWindow(height: number, width: number): void {
    // This action is not needed for mobile, so do nothing
  }
}
