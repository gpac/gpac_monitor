import React, { useState, useEffect } from 'react';
import { useDebounce, useFirstMountState } from 'react-use';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { Spinner } from '../../ui/spinner';

interface GenericInputProps {
  type: 'string' | 'number' | 'boolean';
  value?: string | number | boolean | null;
  onChange: (value: any) => void;
  rules?: {
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
  };
  debounce?: boolean;
  debounceMs?: number;
  argName?: string;
  isPending?: boolean;
}

const INPUT_STYLES =
  'h-7 text-xs bg-gray-800/60 border-gray-600/50 hover:bg-gray-700/50 focus:ring-1 focus:ring-blue-500/50 transition-colors';

export const GenericInput: React.FC<GenericInputProps> = ({
  type,
  value,
  onChange,
  rules,
  debounce = false,
  debounceMs = 100,
  isPending = false,
}) => {
  const [localValue, setLocalValue] = useState(
    value ?? (type === 'string' ? '' : type === 'number' ? null : false),
  );
  const firstRender = useFirstMountState();

  useDebounce(
    () => {
      if (!debounce || firstRender || localValue === value) return;
      onChange(localValue);
    },
    debounceMs,
    [localValue],
  );

  useEffect(() => {
    if (!debounce) return;
    setLocalValue(
      value ?? (type === 'string' ? '' : type === 'number' ? null : false),
    );
  }, [value, type, debounce]);

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    if (!debounce) {
      onChange(newValue);
    }
  };

  if (type === 'boolean') {
    const switchDisabled = rules?.disabled || isPending;

    // Convert value to boolean (handles string "true"/"false" from server)
    const boolValue =
      typeof value === 'string'
        ? value === 'true' || value === '1'
        : Boolean(value);

    const isChecked = debounce ? Boolean(localValue) : boolValue;

    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={isChecked}
          onCheckedChange={handleChange}
          disabled={switchDisabled}
        />
        {isPending && <Spinner size="sm" className="text-info" />}
      </div>
    );
  }

  if (type === 'number') {
    return (
      <Input
        type="number"
        value={debounce ? String(localValue ?? '') : String(value ?? '')}
        onChange={(_e) => {
          const val = _e.target.value === '' ? null : Number(_e.target.value);
          handleChange(val);
        }}
        min={rules?.min}
        max={rules?.max}
        step={rules?.step}
        disabled={rules?.disabled}
        className={INPUT_STYLES}
      />
    );
  }

  return (
    <Input
      type="text"
      value={debounce ? (localValue as string) : (value as string) || ''}
      onChange={(e) => handleChange(e.target.value || null)}
      placeholder={rules?.placeholder}
      disabled={rules?.disabled}
      className={INPUT_STYLES}
    />
  );
};
