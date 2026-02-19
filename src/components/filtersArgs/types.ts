// Re-export domain types from the canonical source
import type {
  GPACTypes,
  GPACArgumentType,
  GpacArgumentValue,
  GpacArgument,
} from '@/types/domain/gpac/gpac_args';
export type { GPACTypes, GPACArgumentType, GpacArgumentValue, GpacArgument };

// Utils for validating GPAC  types
export const gpacValidators = {
  isFraction: (value: string): boolean => {
    const parts = value.split('/');
    return (
      parts.length === 2 &&
      !isNaN(Number(parts[0])) &&
      !isNaN(Number(parts[1])) &&
      Number(parts[1]) !== 0
    );
  },

  isVector2D: (value: [number, number]): boolean => {
    return (
      Array.isArray(value) &&
      value.length === 2 &&
      value.every((n) => typeof n === 'number')
    );
  },
};

export type ArgumentType =
  | 'frac'
  | 'lfrac' // fraction
  | 'uint'
  | 'sint'
  | 'lsint'
  | 'luint'
  | 'flt'
  | 'dbl' //  numeric
  | 'str'
  | 'cstr'
  | '4cc'
  | 'pfmt'
  | 'afmt'
  | 'cprm'
  | 'ctfc'
  | 'cmxc' //  string
  | 'bool'; //  boolean

export interface FilterArgumentBase {
  name: string;
  desc?: string;
  hint?: string;
  description?: string;
  level?: 'normal' | 'advanced' | 'expert';
  default?: GpacArgumentValue;
  min_max_enum?: string;
  update?: boolean;
  update_sync?: boolean;
  enums?: string[];
}

export interface ArgumentInputRules {
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface FilterArgumentInputProps<
  T extends ArgumentType = ArgumentType,
> {
  argument: FilterArgumentBase & {
    type: T;
  };
  value?: InputValue<T>;
  onChange: (value: InputValue<T> | null) => void;
  rules?: ArgumentInputRules;
  standalone?: boolean;
}

export type InputValue<T> = T extends 'bool'
  ? boolean
  : T extends 'uint' | 'sint' | 'luint' | 'lsint' | 'flt' | 'dbl'
    ? number
    : T extends 'frac' | 'lfrac'
      ? string
      : string | string[];
