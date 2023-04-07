import { Injectable } from '@angular/core';
import { IFileBrowserModel } from './file-browser.interface';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AppRoute } from 'src/app/app-routes';
import { FileService } from '../file/file.service';

@Injectable({
  providedIn: 'root'
})
export class FileBrowserService {
  private state: IFileBrowserModel = {
    onOk: null,
    backRoute: null
  };
  constructor(private navigation: NavigationService, private fileService: FileService) { }

  public getState(): IFileBrowserModel {
    return this.state;
  }

  public async browse(model: IFileBrowserModel, directoryPath?: string): Promise<void> {
    this.state = model;
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
