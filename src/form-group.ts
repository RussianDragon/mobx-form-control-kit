import {
  IReactionDisposer,
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
  toJS,
} from 'mobx';
import { AbstractControl } from './abstract-control';
import { ControlTypes } from './types/control-types';
import { ControlsCollection } from './types/controls-collection';
import { ValidatorsFunction } from './types/validators-function';
import { IAbstractControl } from './types/abstract-control';
import { ValidationEvent } from './types/validation-event';
import { Throttled } from './utilities/throttled';
import { FormControl } from './form-control';

interface IStateValidatos {
  workInProcess: boolean;
  events: ValidationEvent[];
}

enum PrivateFields {
  controls = '_controls',
  touched = '_touched',
  reactionValidations = '_reactionValidations',
}

export class FormGroup<TControls extends ControlsCollection> extends AbstractControl {
  //------
  /** Validation in progress / В процессе анализа **/
  public get processing(): boolean {
    return (
      this._reactionValidations.some(rv => rv.result.workInProcess) &&
      this.allControlList.some(c => c.processing)
    );
  }

  //------
  protected get _events(): ValidationEvent[][] {
    return this._reactionValidations.map(rv => rv.result.events);
  }

  //------
  private [PrivateFields.controls]: TControls;

  public get controls(): TControls {
    return this._controls;
  }

  public set controls(controls: TControls) {
    this._controls = controls;
  }

  //------
  /** Valid / Валидные данные **/
  public get valid(): boolean {
    return !this.hasErrors && this.controlList.every(c => c.valid);
  }

  //------
  public get dirty(): boolean {
    return this.controlList.some(c => c.dirty);
  }

  /** Set marker "value changed" / Изменяет состояния маркета "данные изменены" **/
  public set dirty(dirty: boolean) {
    for (const control of this.controlList) control.dirty = dirty;
  }

  //------
  protected [PrivateFields.touched] = false;

  /** The field was in focus / Поле было в фокусе **/
  public get touched(): boolean {
    return this.controlList.length === 0 ? this._touched : this.controlList.some(c => c.touched);
  }

  /** Set marker "field was out of focus" / Изменяет состояния маркета "значение было в фокусе" **/
  public set touched(touched: boolean) {
    this._touched = touched;
    for (const control of this.controlList) control.touched = touched;
  }

  //------
  public get focused(): boolean {
    return this.controlList.some(c => c.focused);
  }

  public set focused(focused: boolean) {
    for (const control of this.controlList) control.focused = focused;
  }

  //------
  public get allControlList(): FormControl<unknown>[] {
    return Array.from(this.getAllControls());
  }

  private get controlList(): IAbstractControl[] {
    return Array.from(this.getControls());
  }

  //------
  private [PrivateFields.reactionValidations]: {
    result: IStateValidatos;
    disposers: IReactionDisposer;
  }[] = [];
  private reactionDisposers: IReactionDisposer[] = [];

  constructor(
    /** Сontrols / Контролы */
    controls: TControls,
    /** Options / Опции */
    options?: {
      /** Validations / Валидациии */
      validators?: ValidatorsFunction<FormGroup<TControls>>[];

      /** Function enable validation by condition (always enabled by default) / Функция включение валидаций по условию (по умолчанию включено всегда) */
      getActivate?: () => boolean;

      /** Additional information / Блок с дополнительной информацией */
      additionalData?: unknown | null;
    },
  ) {
    super(ControlTypes.Group);

    makeObservable<FormGroup<TControls>, PrivateFields>(this, {
      processing: computed,

      _controls: observable,
      controls: computed,

      valid: computed,

      dirty: computed,

      _touched: observable,
      touched: computed,

      focused: computed,

      _reactionValidations: observable.shallow,
    });

    this.getActivate = options?.getActivate;
    this.additionalData = options?.additionalData;
    this._controls = controls;

    this.validators = (options?.validators as ValidatorsFunction<IAbstractControl>[]) ?? [];

    this.reactionDisposers.push(
      reaction(
        () => this.validators.slice(),
        validators => {
          for (const reactionValidation of this._reactionValidations) {
            reactionValidation.disposers();
          }
          this._reactionValidations = validators.map(validator => {
            const throttled = new Throttled<ValidationEvent[]>();
            const result: IStateValidatos = observable({
              workInProcess: false,
              events: [],
            });
            return {
              result: result,
              disposers: reaction(
                () => ({
                  controls: toJS(this.controls),
                  validator: validator(this),
                }),
                data => {
                  result.workInProcess = true;
                  throttled.invoke(
                    () => data.validator,
                    0,
                    events =>
                      runInAction(() => {
                        result.events = events;
                        result.workInProcess = false;
                      }),
                  );
                },
                {
                  fireImmediately: true,
                },
              ),
            };
          });
        },
        {
          fireImmediately: true,
        },
      ),
    );

    this.reactionDisposers.push(
      reaction(
        () => this.allControlList.map(a => toJS(a.value)),
        () => {
          this.tempErrors = [];
        },
      ),
    );
  }

  public dispose(): void {
    for (const reactionValidation of this._reactionValidations) {
      reactionValidation.disposers();
    }

    for (const reactionDisposer of this.reactionDisposers) {
      reactionDisposer();
    }

    super.dispose();
  }

  protected getProcessing = (): boolean =>
    this._reactionValidations.some(rv => rv.result.workInProcess);

  /** Returns a complete list of FormControls without attachments (terminal elements) / Возвращает полный список FormControl-ов без вложений (терминальных элементов) */
  public *getAllControls(): IterableIterator<FormControl<unknown>> {
    for (const control of this.getControls()) {
      if (control.type === ControlTypes.Control) {
        yield control as FormControl<unknown>;
      } else if (control.type === ControlTypes.Group) {
        const group = control as FormGroup<any>;
        for (const groupControl of group.getAllControls()) {
          yield groupControl;
        }
      }
    }
  }

  public *getControls(): IterableIterator<IAbstractControl> {
    for (const keyName in this.controls) {
      const control = this.controls[keyName];
      if (Array.isArray(control)) {
        for (const item of control) yield item;
        continue;
      }
      yield control;
    }
  }
}
