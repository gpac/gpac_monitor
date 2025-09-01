import { useEffect, useState } from 'react';
import { useDebounce, useFirstMountState } from 'react-use';
import { cn } from '../../utils/cn';
import { GPACTypes, GPACArgumentType, InputValue } from './types';
import {
  BooleanInput,
  NumberInput,
  StringInput,
  FractionInput,
  EnumInput,
} from '../filtersArgs/input';
import { convertArgumentValue } from '../../utils/filtersArguments';
import { updateFilterArgument } from '@/shared/store/slices/filterArgumentSlice';
import { useAppDispatch } from '@/shared/hooks/redux';
import { isEnumArgument } from '../../utils/filtersArguments';
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
}

export const FilterArgumentInput = <T extends keyof GPACTypes>({
  argument,
  value,
  onChange,
  rules,
  standalone = false,
  filterId,
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
        const convertedValue = convertArgumentValue(localValue, argument.type);

        // Call the parent onChange handler
        onChange(convertedValue);

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
        // Reset to previous value on error
        setLocalValue(value);
      }
    },
    1000,
    [localValue, filterId, argument.update],
  );

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleLocalChange = (newValue: any) => {
    setLocalValue(newValue);
  };

  // Handle immediate updates for boolean arguments when filterId is provided
  const handleImmediateUpdate = (newValue: any) => {
    const convertedValue = convertArgumentValue(newValue, argument.type);

    // Update local value immediately
    setLocalValue(convertedValue);

    // Call the parent onChange handler
    onChange(convertedValue);

    // If we have filterId and argument is updatable, dispatch immediately
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
    };

    // Debug fullscreen rules flow
    if (argument.name === 'fullscreen') {
      console.log('🔧 FilterArgumentInput inputProps for fullscreen:', {
        originalRules: rules,
        rulesDisabled: rules?.disabled,
        finalInputPropsRules: inputProps.rules,
        finalDisabled: inputProps.rules.disabled,
      });
    }

    if (
      argument.min_max_enum &&
      (argument.min_max_enum.includes('|') ||
        argument.min_max_enum.includes('='))
    ) {
      if (isEnumArgument(argument)) {
        return (
          <EnumInput
            value={localValue as string}
            onChange={(newValue) => {
              handleLocalChange(
                newValue !== null ? newValue : argument.default || '',
              );
            }}
            options={argument.min_max_enum || ''}
            rules={inputProps.rules}
          />
        );
      }
    }

    switch (argument.type as GPACArgumentType) {
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

      case 'strl':
      case 'uintl':
      case 'sintl':
      case '4ccl':
        return (
          <StringInput
            {...(inputProps as FilterArgumentInputProps<'str'>)}
            value={Array.isArray(localValue) ? localValue.join(',') : undefined}
            onChange={(val: string | undefined) =>
              handleLocalChange(val ? val.split(',').filter(Boolean) : null)
            }
          />
        );

      default:
        return (
          <StringInput {...(inputProps as FilterArgumentInputProps<'str'>)} />
        );
    }
  };

  if (standalone) return renderInput();

  return (
    <div
      className={cn(
        'flex items-center p-4 gap-4',
        'transition-all duration-200',
      )}
    >
      {/* Section titre et description */}
      {/*      <div className="flex-1 flex items-center gap-2">
        <span className="font-medium text-sm">{argument.name}</span>
        {argument.desc && (
          <CustomTooltip
            content={argument.desc}
            side="top"
            maxWidth="10rem"
            maxHeight="auto"
          >
            <Info className="w-4 h-4 text-gray-400 cursor-help 
                           hover:text-gray-300 transition-colors" />
          </CustomTooltip>
        )}
      </div> */}

      <div className="flex-1">{renderInput()}</div>
    </div>
  );
};
