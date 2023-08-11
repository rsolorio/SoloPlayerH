import { ComponentFactoryResolver, Injectable, ViewContainerRef } from '@angular/core';
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

  public clearContent(): void {
    this.componentContainer.clear();
    this.componentInstance = undefined;
  }

  public loadContent(content: ISideBarHostModel): void {
    this.clearContent();
    this.model.componentType = content.componentType;
    this.model.title = content.title;
    this.model.subTitle = content.subTitle;
    this.model.titleIcon = content.titleIcon;
    this.model.subTitleIcon = content.subTitleIcon;
    this.model.actions = content.actions;
    this.model.okHidden = content.okHidden;
    this.model.okDelay = content.okDelay;
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

  public closeOk(): void {
    if (this.model.okDelay) {
      setTimeout(() => {
        this.closeAndOk();
      }, this.model.okDelay);
    }
    else {
      this.closeAndOk();
    }
  }

  public closeCancel(): void {
    // Before doing anything close the panel so the backdrop is immediately
    // removed and the hide animation starts
    this.sidebarService.hideRight();
    if (this.model.onCancel) {
      this.model.onCancel();
    }
  }

  private closeAndOk(): void {
    // Before doing anything close the panel so the backdrop is immediately
    // removed and the hide animation starts
    this.sidebarService.hideRight();
    if (this.model.onOk) {
      const instanceModel = this.getInstanceModel();
      if (instanceModel) {
        this.model.onOk(instanceModel);
      }
      else {
        this.model.onOk(this.model);
      }
    }
  }
}
