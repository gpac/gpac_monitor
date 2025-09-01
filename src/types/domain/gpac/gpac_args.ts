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
