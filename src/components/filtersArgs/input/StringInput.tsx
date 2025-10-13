import { GenericInput } from './GenericInput';
import type { FilterArgumentInputProps } from '../types';
import { cn } from '../../../utils/cn';
import React from 'react';

interface StringInputProps extends FilterArgumentInputProps<'str'> {
  enumOptions?: string;
}

export const StringInput: React.FC<StringInputProps> = ({
  value,
  onChange,
  rules,
  enumOptions,
}) => {
  // If enumOptions provided, render a select (like colleague's code)
  if (enumOptions) {
    const parseOptions = React.useMemo(() => {
      return enumOptions.split('|').map((opt) => {
        const trimmed = opt.trim();
        // Handle format "key=value" (e.g., "0=no")
        if (trimmed.includes('=')) {
          const [, enumValue] = trimmed.split('=');
          return enumValue.trim();
        }
        return trimmed;
      });
    }, [enumOptions]);

    const defaultValue =
      parseOptions.length > 0 ? parseOptions[0] : undefined;
    const actualValue =
      value === null || value === undefined ? defaultValue : String(value);

    return (
      <select
        value={actualValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={rules?.disabled}
        className={cn(
          'w-full px-3 py-2 rounded-md text-sm',
          'bg-gray-700 border border-gray-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {parseOptions.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  // Otherwise, render a text input
  return (
    <GenericInput
      type="string"
      value={value}
      onChange={onChange}
      rules={rules}
      debounce
    />
  );
};
