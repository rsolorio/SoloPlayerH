import { Injectable } from '@angular/core';
import { ISize } from 'src/app/core/models/core.interface';
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

  resizeWindow(size: ISize): void {
    // This action is not needed for mobile, so do nothing
  }

  getScreenshot(): Promise<string> {
    return null;
  }
}
