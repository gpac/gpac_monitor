// Primitive types
export interface GPACTypes {
  sint: number;
  uint: number;
  lsint: number;
  luint: number;
  bool: boolean;
  frac: string;
  lfrac: string;
  flt: number;
  dbl: number;
  v2di: Array<Array<number>>;
  v2d: Array<Array<number>>;
  v3di: Array<Array<Array<number>>>;
  v4di: Array<Array<Array<Array<number>>>>;
  str: string;
  mem: ArrayBuffer;
  cstr: string;
  cmem: ArrayBuffer;
  ptr: number;
  strl: Array<string>;
  uintl: Array<number>;
  sintl: Array<number>;
  v2il: Array<Array<number>>;
  '4cc': string;
  '4ccl': Array<string>;
  pfmt: string;
  afmt: string;
  cprm: string;
  ctfc: string;
  cmxc: string;
}

export interface FilterArgument<T extends keyof GPACTypes = keyof GPACTypes> {
  name: string;
  type: T;
  level: 'normal' | 'advanced' | 'expert';
  description: string;
  default?: GPACTypes[T];
  range?: { min: number; max: number };
  enums?: string[];
}

/** Derived from GPACTypes to stay in sync with the canonical GPAC type map */
export type GPACArgumentType = keyof GPACTypes;

/** Union of all possible GPAC argument values (matches GPACTypes value range) */
export type GpacArgumentValue = GPACTypes[keyof GPACTypes] | null;

/** Runtime GPAC argument as received from the server */
export interface GpacArgument {
  name: string;
  desc?: string;
  value?: GpacArgumentValue;
  type?: GPACArgumentType;
  default?: GpacArgumentValue;
  hint?: string;
  min_max_enum?: string;
  update?: boolean;
  update_sync?: boolean;
  min?: number;
  max?: number;
  step?: number;
  enum_values?: string[];
}
