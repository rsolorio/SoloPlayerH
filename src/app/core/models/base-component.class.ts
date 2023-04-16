import { IValueModel } from '../../core/models/core.interface';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Input, forwardRef, Directive, ChangeDetectorRef } from '@angular/core';
import { CoreComponent } from './core-component.class';

const noop = () => { };

@Directive()
// tslint:disable:directive-class-suffix
export abstract class BaseComponent<TModel extends IValueModel<TValue>, TValue> extends CoreComponent implements ControlValueAccessor {

    // Placeholders for the callbacks which are later provided by the Control Value Accessor
    private onTouchedCallback: () => void = noop;
    private onChangeCallback: (_: TValue) => void = noop;

    private _model: TModel;

    // PROPERTIES /////////////////////////////////////////////////////////////////////////////////

    get model(): TModel {
        return this._model;
    }

    @Input() set model(val: TModel) {
        this._model = val;
    }

    get value(): TValue {
        return this._model.value;
    }

    @Input() set value(val: TValue) {
        if (val !== this._model.value) {
            this._model.value = val;
            this.onChangeCallback(val);
            this.onValueChanged();
        }
    }

    // ControlValueAccessor INTERFACE //////////////////////////////////////////////////////////////
    public writeValue(val: TValue) {
        if (val !== this.model.value) {
            this.model.value = val;
            this.changeDetector.markForCheck();
            this.onValueChanged();
        }
    }

    public registerOnChange(fn: (TValue) => void) {
        this.onChangeCallback = fn;
    }

    public registerOnTouched(fn: () => void) {
        this.onTouchedCallback = fn;
    }

    // Constructor ////////////////////////////////////////////////////////////////////////////////
    constructor(private changeDetector: ChangeDetectorRef) {
      super();
      this.initializeModel();
    }

    // PROTECTED METHODS //////////////////////////////////////////////////////////////////////////
    protected initializeModel() {}

    protected onValueChanged() {}
}

export function MakeValueAccessorProvider(type: any) {
    return {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => type),
      multi: true
    };
}