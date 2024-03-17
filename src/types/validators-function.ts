import { ValidationEvent } from "./validation-event";

export type ValidatorsFunction<TAbstractControl> = (
  control: TAbstractControl
) => Promise<ValidationEvent[]>;
