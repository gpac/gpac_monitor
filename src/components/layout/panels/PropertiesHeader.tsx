import { IoClose } from 'react-icons/io5';
import { Checkbox } from '../../ui/checkbox';
import { SearchBar } from '../../ui/search-bar';

interface PropertiesHeaderProps {
  filterName: string;
  onClose: () => void;
  showExpert?: boolean;
  showAdvanced?: boolean;
  onToggleExpert?: (checked: boolean) => void;
  onToggleAdvanced?: (checked: boolean) => void;
  mode?: 'filter' | 'ipid';
  onSearchChange?: (query: string) => void;
}

const PropertiesHeader = ({
  filterName,
  onClose,
  showExpert = false,
  showAdvanced = false,
  onToggleExpert,
  onToggleAdvanced,
  mode = 'filter',
  onSearchChange,
}: PropertiesHeaderProps) => {
  return (
    <div className="bg-monitor-surface border-b border-monitor-line">
      {/* Title and Close Button */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ui text-monitor-text-primary truncate border-b-2 border-monitor-active-filter pb-1 inline-block">
            {filterName}
          </h3>
          <p className="text-xs text-monitor-text-muted mt-1">
            {mode === 'ipid' ? 'IPID Properties' : 'Filter Options'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded  shrink-0"
          aria-label="Close panel"
        >
          <IoClose className="w-4 h-4 text-monitor-text-secondary" />
        </button>
      </div>

      {/* Checkboxes - Only for filter mode */}
      {mode === 'filter' && onToggleAdvanced && onToggleExpert && (
        <div className="px-3 pb-3 flex gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={showAdvanced}
              onCheckedChange={onToggleAdvanced}
            />
            <span className="text-amber-400">Advanced</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={showExpert} onCheckedChange={onToggleExpert} />
            <span className="text-amber-600">Expert</span>
          </label>
        </div>
      )}

      {/* Search Bar */}
      {onSearchChange && (
        <div className="px-3 pb-3">
          <SearchBar
            onSearchChange={onSearchChange}
            placeholder={
              mode === 'ipid' ? 'Filter properties...' : 'Filter arguments...'
            }
            debounceMs={150}
          />
        </div>
      )}
    </div>
  );
};

export default PropertiesHeader;
