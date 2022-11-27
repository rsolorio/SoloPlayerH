import { ComponentFactoryResolver, Injectable, Type, ViewContainerRef } from '@angular/core';
import { IStateService } from '../../models/core.interface';
import { ISideBarHostModel } from './side-bar-host-model.interface';

@Injectable({
  providedIn: 'root'
})
export class SideBarHostStateService implements IStateService<ISideBarHostModel> {
  private model: ISideBarHostModel = {};
  private componentInstance;
  private componentContainer: ViewContainerRef;
  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  public getState(): ISideBarHostModel {
    return this.model;
  }

  /**
   * Saves the container that hosts the component to display.
   * @param viewContainer The ViewContainerRef that hosts the component to display in the side bar.
   */
   public saveComponentContainer(viewContainer: ViewContainerRef): void {
    this.componentContainer = viewContainer;
  }

  public loadComponent(componentType?: Type<any>, model?: any): void {
    this.componentContainer.clear();
    this.componentInstance = undefined;
    this.model.componentType = componentType;
    if (componentType) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentType);
      const component = this.componentContainer.createComponent(componentFactory);
      this.componentInstance = component.instance;
      if (model) {
        this.componentInstance.model = model;
      }
    }
  }
}
