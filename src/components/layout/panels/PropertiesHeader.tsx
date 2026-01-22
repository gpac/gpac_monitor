import { IoClose } from 'react-icons/io5';
import { Checkbox } from '../../ui/checkbox';
import { SearchBar } from '../../ui/search-bar';
import { getColorForMediaType } from '@/utils/filters/streamType';
import { FilterType } from '@/types';

interface PropertiesHeaderProps {
  filterName: string;
  filterIdx: number;
  streamType?: FilterType;
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
  streamType,
  onClose,
  showExpert = false,
  showAdvanced = false,
  onToggleExpert,
  onToggleAdvanced,
  mode = 'filter',
  onSearchChange,
}: PropertiesHeaderProps) => {
  const borderColor = streamType ? getColorForMediaType(streamType) : '#4CC9F0';

  return (
    <div className="bg-monitor-surface border-b border-monitor-line">
      {/* Title and Close Button */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-semibold text-monitor-active-filter truncate pb-1 border-b-2 inline-block"
            style={{ borderBottomColor: borderColor }}
          >
            {filterName}
          </h3>
          {streamType && (
            <p className="text-xs text-monitor-text-muted mt-0.5">
              ({streamType})
            </p>
          )}

          <div className="flex gap-2 mt-1 text-xs text-monitor-text-muted">
            <p>{mode === 'ipid' ? 'IPID Properties' : 'Filter Options'}</p>
          </div>
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
