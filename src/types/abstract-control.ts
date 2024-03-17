import { ValidatorsFunction } from "./validators-function";
import { ValidationEvent } from "./validation-event";
import { ValidationEventTypes } from "./validation-event-types";
import { ControlTypes } from "./control-types";

export interface IAbstractControl {
  /** Validation in progress / В процессе анализа **/
  get processing(): boolean;
  /** Function enable validation by condition (always enabled by default) / Функция включение валидаций по условию (по умолчанию включено всегда) **/
  getActivate?: () => boolean;
  /** Error checking enabled / Проверка ошибок включена  **/
  get active(): boolean;
  /** Error checking is disabled (control is always valid) / Проверка ошибок отключена (контрол всегда валиден)  **/
  get disabled(): boolean;
  /** Valid / Валидные данные **/
  get valid(): boolean;
  /** Invalid / Невалидные данные **/
  get invalid(): boolean;
  /** Value changed / Значение изменялось **/
  get dirty(): boolean;
  /** Set marker "value changed" / Изменяет состояния маркета "данные изменены" **/
  set dirty(dirty: boolean);
  /** The value has not changed / Значение не изменялось **/
  get pristine(): boolean;
  /** The field was in focus / Поле было в фокусе **/
  get touched(): boolean;
  /** Set marker "field was out of focus" / Изменяет состояния маркета "значение было в фокусе" **/
  set touched(touched: boolean);
  /** The field was out of focus / Поле не было в фокусе **/
  get untouched(): boolean;
  /** The field is now in focus / Поле сейчас в фокусе **/
  get focused(): boolean;
  /** Set marker "field is now in focus" / Изменяет состояния маркета "Поле сейчас в фокусе" **/
  set focused(focused: boolean);
  /** All valudation events / Все события валидации **/
  get events(): ValidationEvent[];
  /** Additional (server) errors / Дополнительтные (серверные) ошибки **/
  get tempErrors(): string[];
  /** Additional (server) errors / Дополнительтные (серверные) ошибки **/
  set tempErrors(tempErrors: string[]);
  /** Errors list / Список ошибок **/
  get errors(): ValidationEvent[];
  /** The field contains errors / Присутствуют ошибки **/
  get hasErrors(): boolean;
  /** Warnings messages list / Список сообщений с типом "Внимание" **/
  get warnings(): ValidationEvent[];
  /** The field contains warnings messages / Присутствуют сообщения с типом "Внимание" **/
  get hasWarnings(): boolean;
  /** Informations messages list / Сообщения с типом "Информационные сообщения" **/
  get informations(): ValidationEvent[];
  /** The field contains informations messages / Присутствуют сообщения с типом "Информационные сообщения" **/
  get hasInformations(): boolean;
  /** Successes messages list / Сообщения с типом "успешная валидация" **/
  get successes(): ValidationEvent[];
  /** The field contains successes / Присутствуют сообщения с типом "успешная валидация" **/
  get hasSuccesses(): boolean;
  /** Max message level / Максимальный уровень сообщения **/
  get maxEventLevel(): ValidationEventTypes;
  /** Validators / Валидации */
  get validators(): ValidatorsFunction<IAbstractControl>[];
  /** Additional (server) errors / Дополнительтные (серверные) ошибки **/
  set validators(validators: ValidatorsFunction<IAbstractControl>[]);
  element: HTMLElement | null;
  /** Field for transferring additional information / Поле для передачи дополнительной информации (в логике не участвует) **/
  additionalData?: unknown | null;
  /** Type / Тип контрола **/
  readonly type: ControlTypes;
  /** Dispose (call in unmount react control) / Вызвать при удалении контрола **/
  dispose(): void;
  /** Get error by key / Получить ошибку по ключу */
  event(key: string): ValidationEvent | undefined;
  /** Waiting for end of validation / Ожидание окончания проверки **/
  wait(): Promise<void>;
}
