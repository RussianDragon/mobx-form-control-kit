import {
  IReactionDisposer,
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
  toJS,
} from 'mobx';
import { ValidationEvent } from './types/validation-event';
import { ControlTypes } from './types/control-types';
import { Throttled } from './utilities/throttled';
import { AbstractControl } from './abstract-control';
import { ValidatorsFunction } from './types/validators-function';
import { IAbstractControl } from './types/abstract-control';

interface IStateValidatos {
  workInProcess: boolean;
  events: ValidationEvent[];
}

enum PrivateFields {
  value = '_value',
  dirty = '_dirty',
  touched = '_touched',
  isFocused = '_isFocused',
  reactionValidations = '_reactionValidations',
}

export type UpdateValidValueHandler<TEntity> = (val: TEntity) => void;

export class FormControl<TEntity = string> extends AbstractControl {
  //------
  /** Validation in progress / В процессе анализа **/
  public get processing(): boolean {
    return this._reactionValidations.some(rv => rv.result.workInProcess);
  }

  //------
  protected get _events(): ValidationEvent[][] {
    return this._reactionValidations.map(rv => rv.result.events);
  }

  //------
  private [PrivateFields.value]: TEntity;

  public get value(): TEntity {
    return this._value;
  }

  public set value(value: TEntity) {
    this.initializeCompleted = true;
    this.dirty = true;
    this.tempErrors = [];
    this._value = value;
  }

  //------
  /** Valid / Валидные данные **/
  public get valid(): boolean {
    return !this.hasErrors;
  }

  //------
  /** Callback always when value changes / Срабатывает всегда при изменении значения **/
  onChangeValue?: UpdateValidValueHandler<TEntity> | null;

  /** Callback get last valid value / Передает последние валидное значение **/
  onChangeValidValue?: UpdateValidValueHandler<TEntity> | null;

  //------
  protected [PrivateFields.dirty]: boolean = false;
  /** Value changed / Значение изменялось **/
  public get dirty(): boolean {
    return this._dirty;
  }

  /** Set marker "value changed" / Изменяет состояния маркета "данные изменены" **/
  public set dirty(dirty: boolean) {
    this._dirty = dirty;
  }

  //------
  protected [PrivateFields.touched]: boolean = false;

  /** The field was in focus / Поле было в фокусе **/
  public get touched(): boolean {
    return this._touched;
  }

  /** Set marker "field was out of focus" / Изменяет состояния маркета "значение было в фокусе" **/
  public set touched(touched: boolean) {
    this._touched = touched;
  }

  //------
  private [PrivateFields.isFocused]: boolean = false;

  /** The field is now in focus / Поле сейчас в фокусе **/
  public get focused(): boolean {
    return this._isFocused;
  }

  /** Set marker "field is now in focus" / Изменяет состояния маркета "Поле сейчас в фокусе" **/
  public set focused(focused: boolean) {
    this._isFocused = focused;
    if (!focused) {
      this.touched = true;
    }
  }

  //------
  private [PrivateFields.reactionValidations]: {
    result: IStateValidatos;
    disposers: IReactionDisposer;
  }[] = [];
  private reactionDisposers: IReactionDisposer[] = [];

  //------
  private initializeCompleted: boolean;

  constructor(
    /** Initializing valueI / Инициализирующие значение или его getter */
    valueOrGetterValue: TEntity | (() => TEntity),

    /** Options / Опции */
    options?: {
      /** Validations / Валидациии **/
      validators?: ValidatorsFunction<FormControl<TEntity>>[];

      /** Function enable validation by condition (always enabled by default) / Функция включение валидаций по условию (по умолчанию включено всегда) **/
      getActivate?: () => boolean;

      /** Callback always when value changes / Срабатывает всегда при изменении значения **/
      onChangeValue?: UpdateValidValueHandler<TEntity> | null;

      /** Callback get last valid value / Передает последние валидное значение **/
      onChangeValidValue?: UpdateValidValueHandler<TEntity> | null;

      /** Invoke `onChangeValidValue` when `FormControl` is created. / Вызвать `onChangeValidValue` при создании `FormControl` **/
      callSetterOnInitialize?: boolean;

      /** Additional information / Блок с дополнительной информацией **/
      additionalData?: unknown | null;
    },
  ) {
    super(ControlTypes.Control);
    makeObservable<FormControl<TEntity>, PrivateFields>(this, {
      processing: computed,

      _value: observable,
      value: computed,

      valid: computed,

      _dirty: observable.ref,
      dirty: computed,

      _touched: observable.ref,
      touched: computed,

      _isFocused: observable.ref,
      focused: computed,

      _reactionValidations: observable.shallow,
    });

    this.initializeCompleted = options?.callSetterOnInitialize ?? false;

    this.getActivate = options?.getActivate;
    this.additionalData = options?.additionalData;
    this.validators = (options?.validators as ValidatorsFunction<IAbstractControl>[]) ?? [];
    this.onChangeValue = options?.onChangeValue;
    this.onChangeValidValue = options?.onChangeValidValue;

    const getValue =
      valueOrGetterValue instanceof Function ? valueOrGetterValue : () => valueOrGetterValue;

    this._value = getValue();
    this.reactionDisposers.push(
      reaction(getValue, value => {
        this._value = value;
      }),
    );

    this.reactionDisposers.push(
      reaction(
        () => this._value,
        value => {
          this.onChangeValue?.(value);
        },
        {
          fireImmediately: options?.callSetterOnInitialize ?? false,
        },
      ),
    );

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
                  value: toJS(this.value),
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
        () => ({
          value: toJS(this._value),
          valid: this.valid,
          processing: this.processing,
        }),
        data => {
          if (this.initializeCompleted && !data.processing && data.valid) {
            this.onChangeValidValue?.(data.value);
          }
        },
        {
          fireImmediately: true,
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
}
