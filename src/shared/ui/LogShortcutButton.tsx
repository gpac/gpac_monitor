import { ComponentType, memo } from 'react';

type LogShortcutButtonProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  colorClass: string;
  disabled?: boolean;
  onClick: () => void;
};

/**
 * Reusable button for log shortcuts (errors, warnings, info, or filter-specific logs).
 * Handles disabled state based on count and displays icon + count.
 */
export const LogShortcutButton = memo<LogShortcutButtonProps>(
  ({ icon: Icon, title, count, colorClass, disabled, onClick }) => {
    const isDisabled = disabled ?? (count != null ? count <= 0 : false);

    return (
      <button
        onClick={onClick}
        disabled={isDisabled}
        title={title}
        aria-label={title}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-ui text-sm ${
          isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-800/60 cursor-pointer'
        }`}
      >
        <Icon
          className={`w-3.5 h-3.5 ${isDisabled ? 'text-gray-600' : colorClass}`}
        />
        {count != null && (
          <span
            className={`tabular-nums font-medium ${
              isDisabled ? 'text-gray-600' : colorClass
            }`}
          >
            {count}
          </span>
        )}
      </button>
    );
  },
  (prev, next) => prev.count === next.count && prev.disabled === next.disabled,
);

LogShortcutButton.displayName = 'LogShortcutButton';
