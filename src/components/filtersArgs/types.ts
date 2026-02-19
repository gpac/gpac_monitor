// Re-export GPACTypes from the canonical source
import type { GPACTypes } from '@/types/domain/gpac/gpac_args';
export type { GPACTypes };

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

/** Union of all possible GPAC argument values (matches GPACTypes value range) */
export type GpacArgumentValue = GPACTypes[keyof GPACTypes] | null;

/** Derived from GPACTypes to stay in sync with the canonical GPAC type map */
export type GPACArgumentType = keyof GPACTypes;

export interface GpacArgument {
  /** The name of the argument, used as the identifier when updating */
  name: string;

  /** Optional description of the argument's purpose and functionality */
  desc?: string;

  /** The current value of the argument */
  value?: GpacArgumentValue;

  /** The data type of the argument (e.g., 'bool', 'uint', 'str', etc.) */
  type?: GPACArgumentType;

  /** Default value for the argument when not explicitly set */
  default?: GpacArgumentValue;

  /** Additional information about the argument's usage or purpose */
  hint?: string;

  /** String representing constraints like min/max values or enumeration options */
  min_max_enum?: string;

  /** Indicates whether this argument can be updated at runtime */
  update?: boolean;

  /** Indicates whether updates to this argument need to be synchronized */
  update_sync?: boolean;

  /** Minimum allowed value for numeric arguments */
  min?: number;

  /** Maximum allowed value for numeric arguments */
  max?: number;

  /** Step size for numeric argument inputs */
  step?: number;

  /** For enumeration types, the list of possible values */
  enum_values?: string[];
}
