import { Injectable } from '@angular/core';
import { IFileBrowserItem, IFileBrowserModel } from './file-browser.interface';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AppRoute } from 'src/app/app-routes';
import { FileService } from '../file/file.service';

@Injectable({
  providedIn: 'root'
})
export class FileBrowserService {
  private state: IFileBrowserModel = {
    onOk: () => {}
  };
  constructor(private navigation: NavigationService, private fileService: FileService) { }

  public getState(): IFileBrowserModel {
    return this.state;
  }

  public async browse(directoryPath?: string, onOk?: (values: IFileBrowserItem[]) => void): Promise<void> {
    this.state.onOk = onOk;
    let name = '';
    if (directoryPath) {
      const fileInfo = await this.fileService.getFileInfo(directoryPath);
      if (!fileInfo.hasError) {
        name = fileInfo.name;
      }
    }
    this.navigation.forward(AppRoute.Files, { queryParams: { path: directoryPath, name: name }});
  }
}
