import { ComponentFactoryResolver, Injectable, Type, ViewContainerRef } from '@angular/core';
import { IStateService } from '../../models/core.interface';
import { ISideBarHostModel } from './side-bar-host-model.interface';
import { SideBarStateService } from '../side-bar/side-bar-state.service';

@Injectable({
  providedIn: 'root'
})
export class SideBarHostStateService implements IStateService<ISideBarHostModel> {
  private model: ISideBarHostModel = {
    componentType: null
  };
  private componentInstance;
  private componentContainer: ViewContainerRef;
  constructor(private componentFactoryResolver: ComponentFactoryResolver, private sidebarService: SideBarStateService) { }

  public getState(): ISideBarHostModel {
    return this.model;
  }

  public getInstanceModel(): ISideBarHostModel {
    if (this.componentInstance && this.componentInstance.model) {
      return this.componentInstance.model;
    }
    return null;
  }

  /**
   * Saves the container that hosts the component to display.
   * @param viewContainer The ViewContainerRef that hosts the component to display in the side bar.
   */
   public saveComponentContainer(viewContainer: ViewContainerRef): void {
    this.componentContainer = viewContainer;
  }

  public loadContent(content: ISideBarHostModel): void {
    this.componentContainer.clear();
    this.componentInstance = undefined;
    this.model.componentType = content.componentType;
    this.model.title = content.title;
    this.model.subTitle = content.subTitle;
    this.model.onOk = content.onOk;
    this.model.onCancel = content.onCancel;
    if (this.model.componentType) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.model.componentType);
      const component = this.componentContainer.createComponent(componentFactory);
      this.componentInstance = component.instance;
      this.componentInstance.model = content;
      this.sidebarService.toggleRight();
    }
  }
}
