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

interface IStateValidators {
  workInProcess: boolean;
  events: ValidationEvent[];
}

export type UpdateValidValueHandler<TEntity> = (val: TEntity) => void;

export class FormControl<TEntity = string> extends AbstractControl {
  //------
  /** Validation in progress / В процессе анализа **/
  @computed public get processing(): boolean {
    return this._resultValidations.some(rv => rv.result.workInProcess);
  }

  //------
  protected get _events(): ValidationEvent[][] {
    return this._resultValidations.map(rv => rv.result.events);
  }

  //------
  @observable private accessor _value: TEntity;

  @computed public get value(): TEntity {
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
  @computed public get valid(): boolean {
    return !this.hasErrors;
  }

  //------
  /** Callback always when value changes / Срабатывает всегда при изменении значения **/
  onChangeValue?: UpdateValidValueHandler<TEntity> | null;

  /** Callback get last valid value / Передает последние валидное значение **/
  onChangeValidValue?: UpdateValidValueHandler<TEntity> | null;

  //------
  @observable.ref protected accessor _dirty = false;
  /** Value changed / Значение изменялось **/
  @computed public get dirty(): boolean {
    return this._dirty;
  }

  /** Set marker "value changed" / Изменяет состояния маркета "данные изменены" **/
  public set dirty(dirty: boolean) {
    this._dirty = dirty;
  }

  //------
  @observable.ref protected _touched = false;

  /** The field was in focus / Поле было в фокусе **/
  @computed public get touched(): boolean {
    return this._touched;
  }

  /** Set marker "field was out of focus" / Изменяет состояния маркета "значение было в фокусе" **/
  public set touched(touched: boolean) {
    this._touched = touched;
  }

  //------
  @observable.ref private _isFocused = false;

  /** The field is now in focus / Поле сейчас в фокусе **/
  @computed public get focused(): boolean {
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
  @observable.shallow private _resultValidations: {
    result: IStateValidators;
    disposers: IReactionDisposer;
  }[] = [];
  private reactionDisposers: IReactionDisposer[] = [];

  //------
  private initializeCompleted: boolean;

  private getValue: () => TEntity;
  private callSetterOnInitialize?: boolean;

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
    this.initializeCompleted = options?.callSetterOnInitialize ?? false;

    this.getActivate = options?.getActivate;
    this.additionalData = options?.additionalData;
    this.validators = (options?.validators as ValidatorsFunction<IAbstractControl>[]) ?? [];
    this.onChangeValue = options?.onChangeValue;
    this.onChangeValidValue = options?.onChangeValidValue;

    this.getValue =
      valueOrGetterValue instanceof Function ? valueOrGetterValue : () => valueOrGetterValue;

    this._value = this.getValue();
    this.callSetterOnInitialize = options?.callSetterOnInitialize;
    this.initReactions();
  }

  public dispose(): void {
    this.removeReactions();
    super.dispose();
  }

  public setValue(value: TEntity, callChangeValue: boolean): void {
    if (!callChangeValue) {
      this.removeReactions();
    }
    this._value = value;
    if (!callChangeValue) {
      this.initReactions();
    }
  }

  private removeReactions() {
    for (const reactionValidation of this._resultValidations) {
      reactionValidation.disposers();
    }
    for (const reactionDisposer of this.reactionDisposers) {
      reactionDisposer();
    }
  }

  private initReactions() {
    this.reactionDisposers.push(
      reaction(this.getValue, value => {
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
          fireImmediately: this.initializeCompleted ? false : this.callSetterOnInitialize ?? false,
        },
      ),
    );

    this.reactionDisposers.push(
      reaction(
        () => this.validators.slice(),
        validators => {
          for (const reactionValidation of this._resultValidations) {
            reactionValidation.disposers();
          }
          this._resultValidations = validators.map(validator => {
            const throttled = new Throttled<ValidationEvent[]>();
            const result: IStateValidators = observable({
              workInProcess: false,
              events: [],
            });

            const disposers = reaction(
              () => ({
                value: toJS(this.value),
                validator: validator(this),
              }),
              data => {
                console.log('!_1', data);

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
            );

            return {
              result,
              disposers,
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
}
