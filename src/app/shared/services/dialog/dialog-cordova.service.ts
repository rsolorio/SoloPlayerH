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
}
