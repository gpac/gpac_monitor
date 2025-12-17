import {
  memo,
  useState,
  useCallback,
  useEffect,
  useRef,
  ChangeEvent,
  KeyboardEvent,
} from 'react';
import { IoSearchOutline, IoCloseCircle } from 'react-icons/io5';
import { Input } from './input';
import { cn } from '@/utils/core';

export interface SearchBarProps {
  /** Callback when search value changes (debounced) */
  onSearchChange: (query: string) => void;
  /** Debounce delay in ms (default: 150ms) */
  debounceMs?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Initial value */
  initialValue?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
}

export const SearchBar = memo<SearchBarProps>(function SearchBar({
  onSearchChange,
  debounceMs = 150,
  placeholder = 'Search...',
  className,
  initialValue = '',
  autoFocus = false,
}) {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      onSearchChange(value);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, debounceMs, onSearchChange]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setValue('');
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setValue('');
      e.currentTarget.blur();
    }
  }, []);

  return (
    <div className={cn('relative flex items-center', className)}>
      <IoSearchOutline
        className="absolute left-2.5 h-4 w-4 text-slate-400 pointer-events-none"
        aria-hidden="true"
      />
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pl-8 pr-8 h-8 text-xs bg-slate-900/60 border-slate-700/50
          text-slate-200 placeholder:text-slate-500
          focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/40"
        aria-label="Search input"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 h-4 w-4 text-slate-400 hover:text-slate-200
            transition-colors focus:outline-none focus-visible:ring-1
            focus-visible:ring-emerald-500/40 rounded"
          aria-label="Clear search"
        >
          <IoCloseCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});
