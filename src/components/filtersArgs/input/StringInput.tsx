import { GenericInput, type GenericInputValue } from './GenericInput';
import { Spinner } from '../../ui/spinner';
import type { ArgumentInputRules } from '../types';
import { cn } from '@/utils/core';
import { useMemo } from 'react';

interface StringInputProps {
  argument?: { type: 'str'; name: string };
  value?: string | string[];
  onChange: (value: string | string[] | null) => void;
  rules?: ArgumentInputRules;
  enumOptions?: string;
  isPending?: boolean;
  standalone?: boolean;
}

export const StringInput = ({
  value,
  onChange,
  rules,
  enumOptions,
  isPending = false,
}: StringInputProps) => {
  const parseOptions = useMemo(() => {
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
    const selectDisabled = rules?.disabled || isPending;

    return (
      <div className="flex items-center gap-2 w-full">
        <select
          value={actualValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={selectDisabled}
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
        {isPending && <Spinner size="sm" className="text-blue-400" />}
      </div>
    );
  }

  // Otherwise, render a text input
  return (
    <GenericInput
      type="string"
      value={Array.isArray(value) ? value.join(',') : value}
      onChange={onChange as (v: GenericInputValue) => void}
      rules={rules}
      debounce
      isPending={isPending}
    />
  );
};
