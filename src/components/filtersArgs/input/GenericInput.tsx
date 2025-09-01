import React, { useState, useEffect } from 'react';
import { useDebounce, useFirstMountState } from 'react-use';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';

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
}

const INPUT_STYLES =
  'bg-gray-700 border-gray-600 hover:bg-gray-600/50 focus:ring-blue-500';

export const GenericInput: React.FC<GenericInputProps> = ({
  type,
  value,
  onChange,
  rules,
  debounce = false,
  debounceMs = 1000,
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
    // Log only once every 100ms to avoid spam
    const now = Date.now();
    if (!(window as any).lastBooleanLog || now - (window as any).lastBooleanLog > 100) {
      console.log('🔧 Boolean switch:', {
        value,
        localValue,
        disabled: rules?.disabled,
        checked: debounce ? (localValue as boolean) : (value as boolean) || false
      });
      (window as any).lastBooleanLog = now;
    }
    
    return (
      <Switch
        checked={
          debounce ? (localValue as boolean) : (value as boolean) || false
        }
        onCheckedChange={handleChange}
        disabled={rules?.disabled}
        className="data-[state=checked]:bg-blue-600"
      />
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
