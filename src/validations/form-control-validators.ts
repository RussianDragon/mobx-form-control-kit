import { FormControl } from "../form-control";
import { ValidatorsFunction } from "../types/validators-function";
import { ValidationEvent } from "../types/validation-event";
import { ValidationEventTypes } from "../types/validation-event-types";

//------
export const requiredValidatorKey = "required";
export const requiredValidator =
  <TEntity>(
    message: string = "Поле обязательно",
    eventType = ValidationEventTypes.Error,
    key = requiredValidatorKey
  ): ValidatorsFunction<FormControl<TEntity>> =>
  async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (!!control.value) {
      return [];
    }
    return [
      {
        message,
        key,
        type: eventType,
      },
    ];
  };

//------
type TStrEntity = string | null | undefined;

/** Not empty string / Не пустая строка */
export const notEmptyOrSpacesValidatorKey = "notEmptyOrSpaces";
export const notEmptyOrSpacesValidator =
  <TEntity extends TStrEntity>(
    message: string = "Отсутствует значение",
    eventType = ValidationEventTypes.Error,
    key = notEmptyOrSpacesValidatorKey
  ): ValidatorsFunction<FormControl<TEntity>> =>
  async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (!!control.value && control.value.trim() !== "") {
      return [];
    }
    return [
      {
        message,
        key,
        type: eventType,
      },
    ];
  };

//------
export const notContainSpacesValidatorKey = "notContainSpaces";
/** Not contain spaces / Не содержит проблелов */
export const notContainSpacesValidator =
  <TEntity extends TStrEntity>(
    message: string = "Не может содержать пробелы",
    eventType = ValidationEventTypes.Error,
    key = notContainSpacesValidatorKey
  ): ValidatorsFunction<FormControl<TEntity>> =>
  async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (!!control.value && !/\s/.test(control.value)) {
      return [];
    }
    return [
      {
        message,
        key,
        type: eventType,
      },
    ];
  };

//------
export const patternValidatorKey = "notLikePattern";
/** Error if there is no pattern matching / Ошибка, если нет соответствия паттерну */
export const patternValidator =
  <TEntity extends TStrEntity>(
    regExp: RegExp,
    message: string = "Присутствуют недопустимые символы",
    eventType = ValidationEventTypes.Error,
    key = patternValidatorKey
  ): ValidatorsFunction<FormControl<TEntity>> =>
  async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (control.value != null && regExp.test(control.value)) {
      return [];
    }
    return [
      {
        message,
        key,
        type: eventType,
      },
    ];
  };

//------
export const invertPatternValidatorKey = "likePattern";
/** Error if there is a pattern match / Ошибка, если есть соответствие паттерну */
export const invertPatternValidator =
  <TEntity extends TStrEntity>(
    regExp: RegExp,
    message: string = "Присутствуют недопустимые символы",
    eventType = ValidationEventTypes.Error,
    key = invertPatternValidatorKey
  ): ValidatorsFunction<FormControl<TEntity>> =>
  async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (control.value != null && regExp.test(control.value)) {
      return [
        {
          message,
          key,
          type: eventType,
        },
      ];
    }
    return [];
  };

//------
export const minLengthValidatorKey = "minlength";
export const minLengthValidator =
  <TEntity extends TStrEntity>(
    minlength: number,
    message: string = `Минимальная длина ${minlength}`,
    eventType = ValidationEventTypes.Error,
    key = minLengthValidatorKey
  ): ValidatorsFunction<FormControl<TEntity>> =>
  async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (!control.value || minlength <= control.value.length) {
      return [];
    }
    return [
      {
        message,
        key,
        type: eventType,
      },
    ];
  };

//------
export const maxLengthValidatorKey = "maxlength";
export const maxLengthValidator =
  <TEntity extends TStrEntity>(
    maxlength: number,
    message: string = `Максимальная длина ${maxlength}`,
    eventType = ValidationEventTypes.Error,
    key = maxLengthValidatorKey
  ): ValidatorsFunction<FormControl<TEntity>> =>
  async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (!control.value || control.value.length <= maxlength) {
      return [];
    }
    return [
      {
        message,
        key,
        type: eventType,
      },
    ];
  };

//------
export const absoluteLengthValidatorKey = "absoluteLength";
export const absoluteLengthValidator =
  <TEntity extends TStrEntity>(
    length: number,
    message: string = `Длина отлична от ${length}`,
    eventType = ValidationEventTypes.Error,
    key = absoluteLengthValidatorKey
  ): ValidatorsFunction<FormControl<TEntity>> =>
  async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (!control.value || control.value.length === length) {
      return [];
    }
    return [
      {
        message,
        key,
        type: eventType,
      },
    ];
  };

//------
type TReferenceValueEntity = number | Date;
type TValueEntity = TReferenceValueEntity | string | null;

export const minValueValidatorKey = "minValue";
export const minValueValidator = <TEntity extends TValueEntity>(
  min: TReferenceValueEntity | (() => TReferenceValueEntity),
  message: string = "Значение слишком маленькое",
  eventType = ValidationEventTypes.Error,
  key = minValueValidatorKey
): ValidatorsFunction<FormControl<TEntity>> => {
  const getMin = typeof min === "function" ? min : () => min;
  return async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (control.value == null) {
      return [];
    }
    const minValue = getMin();
    let value: any = control.value;
    if (typeof value === "string") {
      if (typeof minValue === "number") {
        value = +value;
      } else if (minValue instanceof Date) {
        value = new Date(value);
      }
    }
    if (value < minValue) {
      return [
        {
          message,
          key,
          type: eventType,
        },
      ];
    }
    return [];
  };
};

//------
export const maxValueValidatorKey = "minValue";
export const maxValueValidator = <TEntity extends TValueEntity>(
  max: TReferenceValueEntity | (() => TReferenceValueEntity),
  message: string = "Значение слишком большое",
  eventType = ValidationEventTypes.Error,
  key = maxValueValidatorKey
): ValidatorsFunction<FormControl<TEntity>> => {
  const getMax = typeof max === "function" ? max : () => max;
  return async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (control.value == null) {
      return [];
    }
    const maxValue = getMax();
    let value: any = control.value;
    if (typeof value === "string") {
      if (typeof maxValue === "number") {
        value = +value;
      } else if (maxValue instanceof Date) {
        value = new Date(value);
      }
    }
    if (maxValue < value) {
      return [
        {
          message,
          key,
          type: eventType,
        },
      ];
    }
    return [];
  };
};

//------
export const compairValidatorKey = "compair";
/** Wrapper for complex validation (error if validation returns false) / Обёртка для сложной проверки (ошибка, если проверка вернула false) */
export const compareValidator =
  <TEntity>(
    expression: (value: TEntity) => boolean,
    message: string = "Поле не валидно",
    eventType = ValidationEventTypes.Error,
    key = compairValidatorKey
  ): ValidatorsFunction<FormControl<TEntity>> =>
  async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (expression(control.value)) {
      return [];
    }
    return [
      {
        message,
        key,
        type: eventType,
      },
    ];
  };

//------
export const isEqualValidatorKey = "isEqual";
/** Equals to {value} / Равно значению {value} */
export const isEqualValidator =
  <TEntity>(
    value: TEntity,
    message: string = "Поля не совпадают",
    eventType = ValidationEventTypes.Error,
    key = isEqualValidatorKey
  ): ValidatorsFunction<FormControl<TEntity>> =>
  async (control: FormControl<TEntity>): Promise<ValidationEvent[]> => {
    if (!!control.value && control.value !== value) {
      return [];
    }
    return [
      {
        message,
        key,
        type: eventType,
      },
    ];
  };
