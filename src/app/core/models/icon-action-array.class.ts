import { IIconAction } from "./core.interface";

export class IconActionArray extends Array<IIconAction> {
  public on(id: string): void {
    const icon = this.get(id);
    if (icon) {
      icon.off = false;
    }
  }
  public off(id: string): void {
    const icon = this.get(id);
    if (icon) {
      icon.off = true;
    }
  }
  public show(id: string): void {
    const icon = this.get(id);
    if (icon) {
      icon.hidden = false;
    }
  }
  public hide(id: string): void {
    const icon = this.get(id);
    if (icon) {
      icon.hidden = true;
    }
  }
  public showAll(): void {
    for (const icon of this) {
      icon.hidden = false;
    }
  }
  public hideAll(): void {
    for (const icon of this) {
      icon.hidden = true;
    }
  }

  public get(id: string): IIconAction {
    return this.find(i => i.id === id);
  }
}