import React from 'react';
import { IoClose } from 'react-icons/io5';
import { Checkbox } from '../../ui/checkbox';

interface PropertiesHeaderProps {
  filterName: string;
  onClose: () => void;
  showExpert: boolean;
  showAdvanced: boolean;
  onToggleExpert: (checked: boolean) => void;
  onToggleAdvanced: (checked: boolean) => void;
}

const PropertiesHeader: React.FC<PropertiesHeaderProps> = ({
  filterName,
  onClose,
  showExpert,
  showAdvanced,
  onToggleExpert,
  onToggleAdvanced,
}) => {
  return (
    <div className=" bg-slate-950 border-b border-gray-700/50">
      {/* Title and Close Button */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ui text-gray-100 truncate">
            {filterName}
          </h3>
          <p className="text-xs text-gray-400">Properties</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors shrink-0"
          aria-label="Close panel"
        >
          <IoClose className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Checkboxes */}
      <div className="px-3 pb-3 flex gap-4 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={showAdvanced} onCheckedChange={onToggleAdvanced} />
          <span className="text-orange-400">Advanced</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={showExpert} onCheckedChange={onToggleExpert} />
          <span className="text-orange-400">Expert</span>
        </label>
      </div>
    </div>
  );
};

export default PropertiesHeader;
