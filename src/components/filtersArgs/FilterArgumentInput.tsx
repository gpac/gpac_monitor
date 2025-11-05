import { useEffect, useState } from 'react';
import { useDebounce, useFirstMountState } from 'react-use';
import { GPACTypes, GPACArgumentType, InputValue } from './types';
import {
  BooleanInput,
  NumberInput,
  StringInput,
  FractionInput,
} from '../filtersArgs/input';
import { convertArgumentValue } from '@/utils/gpac';
import { updateFilterArgument } from '@/shared/store/slices/filterArgumentSlice';
import { useAppDispatch } from '@/shared/hooks/redux';
import { FilterArgumentBase } from './types';

interface FilterArgumentInputProps<
  T extends keyof GPACTypes = keyof GPACTypes,
> {
  argument: FilterArgumentBase & {
    type: T;
  };
  value?: InputValue<T>;
  onChange: (value: InputValue<T> | null) => void;
  rules?: Record<string, any>;
  standalone?: boolean;
  filterId?: string;
  isPending?: boolean;
}

export const FilterArgumentInput = <T extends keyof GPACTypes>({
  argument,
  value,
  onChange,
  rules,
  standalone = false,
  filterId,
  isPending = false,
}: FilterArgumentInputProps<T>) => {
  const [localValue, setLocalValue] = useState<InputValue<T> | undefined>(
    value,
  );
  const firstRender = useFirstMountState();
  const dispatch = useAppDispatch();

  useDebounce(
    () => {
      if (firstRender || localValue === value) return;

      try {
        // Check if this is an enum argument
        const isEnum =
          argument.min_max_enum &&
          (argument.min_max_enum.includes('|') ||
            argument.min_max_enum.includes('='));

        let convertedValue;
        if (isEnum) {
          // For enums: send text value directly
          convertedValue = String(localValue);
        } else {
          // For other types: use standard conversion
          convertedValue = convertArgumentValue(localValue, argument.type);
        }

        onChange(convertedValue as InputValue<T> | null);

        // If the argument is updatable and we have a filterId, dispatch the update action
        if (argument.update && filterId && !standalone) {
          dispatch(
            updateFilterArgument({
              filterId,
              argName: argument.name,
              argValue: convertedValue,
            }),
          );
        }
      } catch (error) {
        console.error('Error converting value:', error);

        setLocalValue(value);
      }
    },
    1000,
    [localValue, filterId, argument.update, argument.min_max_enum],
  );

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleLocalChange = (newValue: any) => {
    setLocalValue(newValue);
  };

  // Handle immediate updates for boolean arguments when filterId is provided
  const handleImmediateUpdate = (newValue: any) => {
    const isEnum =
      argument.min_max_enum &&
      (argument.min_max_enum.includes('|') ||
        argument.min_max_enum.includes('='));

    let convertedValue;
    if (isEnum) {
      convertedValue = String(newValue);
    } else {
      convertedValue = convertArgumentValue(newValue, argument.type);
    }

    setLocalValue(convertedValue as InputValue<T>);

    onChange(convertedValue as InputValue<T> | null);

    if (filterId && argument.update && !standalone) {
      dispatch(
        updateFilterArgument({
          filterId,
          argName: argument.name,
          argValue: convertedValue,
        }),
      );
    }
  };

  const renderInput = () => {
    const inputProps = {
      value: localValue,
      onChange:
        filterId && argument.type === 'bool'
          ? handleImmediateUpdate
          : handleLocalChange,
      rules: {
        ...rules,
        disabled: rules?.disabled,
      },
      argument,
      isPending,
    };

    // If the argument is an enum, treat it as a string
    const adjustedType =
      argument.min_max_enum &&
      (argument.min_max_enum.includes('|') ||
        argument.min_max_enum.includes('='))
        ? 'str'
        : (argument.type as GPACArgumentType);

    switch (adjustedType) {
      case 'bool':
        return (
          <BooleanInput
            {...(inputProps as FilterArgumentInputProps<'bool'>)}
            argName={argument.name}
          />
        );

      case 'uint':
      case 'sint':
      case 'luint':
      case 'lsint':
      case 'flt':
      case 'dbl':
        return (
          <NumberInput {...(inputProps as FilterArgumentInputProps<'uint'>)} />
        );

      case 'frac':
      case 'lfrac':
        return (
          <FractionInput
            {...(inputProps as FilterArgumentInputProps<'frac'>)}
          />
        );

      case 'v2di':
      case 'v2d':
      case 'v3di':
      case 'v4di':
        return (
          <StringInput
            {...(inputProps as FilterArgumentInputProps<'str'>)}
            value={
              typeof localValue === 'object' && localValue !== null
                ? Object.values(localValue).join('x')
                : String(localValue || '')
            }
            onChange={(val: string | undefined) => {
              if (!val) {
                handleLocalChange(null);
                return;
              }
              // Parse "1x2" → {x:1, y:2} ou "1x2x3" → {x:1, y:2, z:3}
              const parts = val.split('x').map((v) => parseFloat(v) || 0);
              const keys = ['x', 'y', 'z', 'w'];
              const vector = parts.reduce(
                (acc, val, i) => ({ ...acc, [keys[i]]: val }),
                {},
              );
              handleLocalChange(vector);
            }}
          />
        );

      case 'strl':
      case 'uintl':
      case 'sintl':
      case '4ccl':
      case 'v2il':
        return (
          <StringInput
            {...(inputProps as FilterArgumentInputProps<'str'>)}
            value={Array.isArray(localValue) ? localValue.join(',') : undefined}
            onChange={(val: string | undefined) =>
              handleLocalChange(val ? val.split(',').filter(Boolean) : null)
            }
          />
        );

      case 'str':
      default:
        return (
          <StringInput
            {...(inputProps as FilterArgumentInputProps<'str'>)}
            enumOptions={argument.min_max_enum}
          />
        );
    }
  };

  if (standalone) return renderInput();

  return <div className="w-full">{renderInput()}</div>;
};
