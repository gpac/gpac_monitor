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
  // Always call useMemo to satisfy React Hooks rules
  const parseOptions = React.useMemo(() => {
    if (!enumOptions) return [];
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

  if (enumOptions) {
    const defaultValue = parseOptions.length > 0 ? parseOptions[0] : undefined;
    const actualValue =
      value === null || value === undefined ? defaultValue : String(value);

    return (
      <select
        value={actualValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={rules?.disabled}
        className={cn(
          'w-full h-7 px-2 py-0 rounded text-xs',
          'bg-gray-800/50 border border-gray-600/50',
          'hover:bg-gray-700/50 transition-colors',
          'focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50',
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
