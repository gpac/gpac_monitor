import { FiLayout } from 'react-icons/fi';
import { FaChevronDown } from 'react-icons/fa6';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@radix-ui/react-popover';
import { WidgetType } from '@/types';
import { LuFileText, LuGauge, LuShare2, LuVolume2 } from 'react-icons/lu';
import { WidgetButton } from './WidgetButton';

interface WidgetSelectorProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const availableWidgets = [
  {
    type: WidgetType.AUDIO,
    title: 'Audio Monitor',
    icon: LuVolume2,
    defaultSize: { w: 4, h: 4 },
  },

  {
    type: WidgetType.METRICS,
    title: 'System Metrics',
    icon: LuGauge,
    defaultSize: { w: 6, h: 4 },
  },
  {
    type: WidgetType.LOGS,
    title: 'System Logs',
    icon: LuFileText,
    defaultSize: { w: 4, h: 4 },
  },
  {
    type: WidgetType.GRAPH,
    title: 'Pipeline Graph',
    icon: LuShare2,
    defaultSize: { w: 6, h: 8 },
  },

  {
    type: WidgetType.MULTI_FILTER,
    title: 'Session Filters',
    icon: FiLayout,
    defaultSize: { w: 12, h: 4 },
  },
];

const WidgetSelector: React.FC<WidgetSelectorProps> = ({
  isOpen,
  onToggle,
  onClose,
}) => {
  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => (open ? onToggle() : onClose())}
    >
      <PopoverTrigger asChild>
        <button
          onClick={onToggle}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:ring-offset-2 focus:ring-offset-gray-900
            ${
              isOpen
                ? 'bg-gray-800 text-white ring-2 ring-red-600/50'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800 hover:text-white'
            }
          `}
          aria-label="Toggle widgets menu"
          aria-expanded={isOpen}
        >
          <FiLayout className="w-4 h-4" />
          <span className="font-small text-ui ">Widgets</span>
          <FaChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="
          w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 z-50
          data-[state=open]:animate-popoverShow
          data-[state=closed]:animate-popoverHide
        "
        sideOffset={5}
      >
        <div className="space-y-2">
          {availableWidgets.map((widget) => (
            <WidgetButton key={widget.type} {...widget} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WidgetSelector;
