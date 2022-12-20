import { IDialogOptions } from "./dialog.interface";

export abstract class DialogService {

  constructor() { }

  abstract openDevTools(): void;

  abstract openFolderDialog(options?: IDialogOptions): string[];
}
