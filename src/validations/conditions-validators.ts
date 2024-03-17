import { IAbstractControl } from "../types/abstract-control";
import { ValidatorsFunction } from "../types/validators-function";
import { ValidationEvent } from "../types/validation-event";

//------
/** Wrapper for sequential validations (The next validation is launched only after the previous one passed without errors) / Обертка для последовательных валидаций (Следующая валидация запускается, только после того, что предыдущая прошла без ошибок) */
export const wrapperSequentialCheck =
  <TAbstractControl extends IAbstractControl>(
    validators: ValidatorsFunction<TAbstractControl>[]
  ): ValidatorsFunction<TAbstractControl> =>
  async (control: TAbstractControl): Promise<ValidationEvent[]> => {
    for (const validator of validators) {
      const validationResult = await validator(control);
      if (validationResult.length > 0) {
        return validationResult;
      }
    }
    return [];
  };

//------
/** Runs validations only if activation conditions are met / Запускает валидации только если условие активации выполнено */
export const wrapperActivateValidation =
  <TAbstractControl extends IAbstractControl>(
    activate: (control: TAbstractControl) => Promise<boolean>,
    validators: ValidatorsFunction<TAbstractControl>[] = [],
    elseValidators: ValidatorsFunction<TAbstractControl>[] = []
  ): ValidatorsFunction<TAbstractControl> =>
  async (control: TAbstractControl): Promise<ValidationEvent[]> => {
    const isActivate = await activate(control);
    const actualValidators = isActivate ? validators : elseValidators;
    const validationResult = await Promise.all(
      actualValidators.map((validator) => validator(control))
    );
    return validationResult.flat();
  };
