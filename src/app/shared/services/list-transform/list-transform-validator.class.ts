import { IListTransformValidator } from "./list-transform.interface";

/** Base class for implementing a transform validator for the ListTransform service. */
export abstract class ListTransformValidatorBase<T> implements IListTransformValidator {
  private _count: number;
  /** Number of times the validate method has succeeded (returned true) */
  get successCount(): number {
    return this._count;
  }

  /** Determines if the iteration process can be reset in order to start over validations. */
  protected get canBeReset(): boolean {
    return true;
  }

  /** Item currently being validated. */
  protected currentItem: T;

  public validate(item: T, properties?: string[]): boolean {
    this.currentItem = item;
    const result = this.innerValidate(item, properties);
    this.currentItem = null;
    if (result) {
      this._count++;
    }
    return result;
  }

  public reset(): void {
    if (this.canBeReset) {
      this._count = 0;
      this.innerReset();
    }
  }

  protected abstract innerValidate(item: T, properties?: string[]): boolean;

  protected innerReset(): void {}
}