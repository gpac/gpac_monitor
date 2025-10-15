import { memo, ReactNode } from 'react';

interface WidgetStatusBadgeProps {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const WidgetStatusBadge = memo<WidgetStatusBadgeProps>(
  ({ icon, children, className = '' }) => {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-md border border-gray-700 bg-gray-800/80 font-ui ${className}`}
      >
        {icon && <span className="text-xs">{icon}</span>}
        {children}
      </div>
    );
  },
);

WidgetStatusBadge.displayName = 'WidgetStatusBadge';
