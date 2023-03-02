import { ISize } from "src/app/core/models/core.interface";
import { IDialogOptions } from "./dialog.interface";

export abstract class DialogService {

  constructor() { }

  abstract openDevTools(): void;

  abstract openFolderDialog(options?: IDialogOptions): string[];

  abstract openFileDialog(options?: IDialogOptions): string[];

  abstract resizeWindow(size: ISize): void;
}
