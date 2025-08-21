import { computed, observable, when } from 'mobx';
import { ControlTypes } from './types/control-types';
import { ValidationEventTypes } from './types/validation-event-types';
import { ValidationEvent } from './types/validation-event';
import { IAbstractControl } from './types/abstract-control';
import { ValidatorsFunction } from './types/validators-function';

export abstract class AbstractControl implements IAbstractControl {
  //------
  /** Validation in progress / В процессе анализа **/
  public abstract get processing(): boolean;

  //------
  /** Function enable validation by condition (always enabled by default) / Функция включение валидаций по условию (по умолчанию включено всегда) **/
  @observable.ref public accessor getActivate: undefined | (() => boolean);

  /** Error checking enabled / Проверка ошибок включена  **/
  @computed public get active(): boolean {
    return this.getActivate?.() ?? true;
  }

  /** Error checking is disabled (reverse active) / Проверка ошибок отключена (обратное значение active)  **/
  @computed public get disabled(): boolean {
    return !this.active;
  }

  //------
  /** Valid / Валидные данные **/
  public abstract get valid(): boolean;

  /** Invalid / Невалидные данные **/
  @computed public get invalid(): boolean {
    return !this.valid;
  }

  //------
  /** Value changed / Значение изменялось **/
  public abstract get dirty(): boolean;

  /** Set marker "value changed" / Изменяет состояния маркета "данные изменены" **/
  public abstract set dirty(dirty: boolean);

  /** The value has not changed / Значение не изменялось **/
  @computed public get pristine(): boolean {
    return !this.dirty;
  }

  //------
  /** The field was in focus / Поле было в фокусе **/
  public abstract get touched(): boolean;

  /** Set marker "field was out of focus" / Изменяет состояния маркета "значение было в фокусе" **/
  public abstract set touched(touched: boolean);

  /** The field was out of focus / Поле не было в фокусе **/
  @computed public get untouched(): boolean {
    return !this.touched;
  }

  //------
  /** The field is now in focus / Поле сейчас в фокусе **/
  public abstract get focused(): boolean;

  /** Set marker "field is now in focus" / Изменяет состояния маркета "Поле сейчас в фокусе" **/
  public abstract set focused(focused: boolean);

  //------
  protected abstract get _events(): ValidationEvent[][];

  @computed public get events(): ValidationEvent[] {
    return this.active ? this._events.flat() : [];
  }

  //------
  @observable.shallow private accessor _tempErrors: string[] = [];

  /** Additional (server) errors / Дополнительтные (серверные) ошибки **/
  @computed public get tempErrors(): string[] {
    return this.active ? this._tempErrors : [];
  }

  /** Additional (server) errors / Дополнительтные (серверные) ошибки **/
  public set tempErrors(tempErrors: string[]) {
    this._tempErrors = tempErrors || [];
  }

  //------
  /** Errors list / Список ошибок **/
  @computed public get errors(): ValidationEvent[] {
    return this.events.filter(e => e.type === ValidationEventTypes.Error);
  }

  /** The field contains errors / Присутствуют ошибки **/
  @computed public get hasErrors() {
    return this.errors.length > 0 || this._tempErrors.length > 0;
  }

  //------
  /** Warnings messages list / Список сообщений с типом "Внимание" **/
  @computed public get warnings(): ValidationEvent[] {
    return this.events.filter(e => e.type === ValidationEventTypes.Warning);
  }

  /** The field contains warnings messages / Присутствуют сообщения с типом "Внимание" **/
  @computed public get hasWarnings() {
    return this.warnings.length > 0;
  }

  //------
  /** Informations messages list / Сообщения с типом "Информационные сообщения" **/
  @computed public get informations(): ValidationEvent[] {
    return this.events.filter(e => e.type === ValidationEventTypes.Informations);
  }

  /** The field contains informations messages / Присутствуют сообщения с типом "Информационные сообщения" **/
  @computed public get hasInformations() {
    return this.informations.length > 0;
  }

  //------
  /** Successes messages list / Сообщения с типом "успешная валидация" **/
  @computed public get successes(): ValidationEvent[] {
    return this.events.filter(e => e.type === ValidationEventTypes.Success);
  }

  /** The field contains successes / Присутствуют сообщения с типом "успешная валидация" **/
  @computed public get hasSuccesses() {
    return this.successes.length > 0;
  }

  /** Max message level / Максимальный уровень сообщения **/
  @computed public get maxEventLevel(): ValidationEventTypes {
    if (this.hasErrors) return ValidationEventTypes.Error;
    if (this.hasWarnings) return ValidationEventTypes.Warning;
    if (this.hasInformations) return ValidationEventTypes.Informations;
    return ValidationEventTypes.Success;
  }

  //------
  @observable.shallow
  private accessor _validators: ValidatorsFunction<IAbstractControl>[] = [];

  @computed public get validators(): ValidatorsFunction<IAbstractControl>[] {
    return this._validators;
  }

  /** Additional (server) errors / Дополнительтные (серверные) ошибки **/
  public set validators(validators: ValidatorsFunction<IAbstractControl>[]) {
    this._validators = validators || [];
  }

  //------
  @observable.ref public accessor element: HTMLElement | null = null;

  /** Field for transferring additional information / Поле для передачи дополнительной информации (в логике не участвует) **/
  @observable public accessor additionalData: unknown | null;

  constructor(
    /** Type / Тип контрола **/
    public readonly type: ControlTypes,
  ) {}

  /** Dispose (call in unmount react control) / Вызвать при удалении контрола **/
  public dispose(): void {
    //
  }

  /** Get error by key / Получить ошибку по ключу */
  public event(key: string): ValidationEvent | undefined {
    return this.events.find(err => err.key === key);
  }

  /** Waiting for end of validation / Ожидание окончания проверки **/
  public wait(): Promise<void> {
    return when(() => !this.processing);
  }
}
