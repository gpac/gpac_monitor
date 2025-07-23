// Types spécifiques aux FilterArgs
export interface GPACTypes {
  // Numerics
  sint: number;
  luint: number;
  uint: number;
  lsint: number;
  flt: number;
  dbl: number;
  bool: string;
  // Fractions
  frac: string;
  lfrac: string;
  // Strings
  str: string;
  cstr: string;
  '4cc': string;
  //Vectors
  v2di: [number, number];
  v3di: [number, number, number];
  v4di: [number, number, number, number];
  //binaries types
  mem: ArrayBuffer;
  cmem: ArrayBuffer;
  ptr: number;
  //list types
  strl: string[];
  uintl: number[];
  sintl: number[];
  '4ccl': string[];
  // Media format types
  pfmt: string;
  afmt: string;
  cprm: string;
  cftc: string;
  cmxc: string;
}

// Utils for validating GPAC complexes types
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
  default?: any;
  min_max_enum?: string;
  update?: boolean;
  update_sync?: boolean;
  enums?: string[];
}

export interface FilterArgumentInputProps<
  T extends ArgumentType = ArgumentType,
> {
  argument: FilterArgumentBase & {
    type: T;
  };
  value?: any;
  onChange: (value: any | null) => void;
  rules?: Record<string, any>;
  standalone?: boolean;
}

export type InputValue<T> = T extends 'bool'
  ? boolean
  : T extends 'uint' | 'sint' | 'luint' | 'lsint' | 'flt' | 'dbl'
    ? number
    : T extends 'frac' | 'lfrac'
      ? string
      : string | string[];

export type GPACArgumentType =
  | 'bool'
  | 'uint'
  | 'sint'
  | 'luint'
  | 'lsint'
  | 'flt'
  | 'dbl'
  | 'frac'
  | 'lfrac'
  | 'str'
  | 'cstr'
  | 'strl'
  | 'uintl'
  | 'sintl'
  | '4ccl'
  | '4cc'
  | 'pfmt'
  | 'afmt'
  | 'cprm'
  | 'ctfc';

export interface GpacArgument {
  /** The name of the argument, used as the identifier when updating */
  name: string;

  /** Optional description of the argument's purpose and functionality */
  desc?: string;

  /** The current value of the argument */
  value?: any;

  /** The data type of the argument (e.g., 'bool', 'uint', 'str', etc.) */
  type?: string;

  /** Default value for the argument when not explicitly set */
  default?: any;

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
