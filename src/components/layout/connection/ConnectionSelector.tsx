import { useCallback, useState, useMemo, memo } from 'react';
import { LuPlug2 } from 'react-icons/lu';
import { FaChevronDown } from 'react-icons/fa6';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@radix-ui/react-popover';
import { Badge } from '@/components/ui/badge';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import { useConnectionStatusSync } from '@/shared/hooks/useConnectionStatusSync';
import {
  selectAllConnections,
  selectActiveConnection,
} from '@/shared/store/selectors';
import { setActiveConnection } from '@/shared/store/slices/connectionsSlice';
import { getConnectionStatusClass } from '@/utils/connectionStatus';
import { ConnectionStatus } from '@/types/communication/shared';
import ManageConnectionsDialog from './ManageConnectionsDialog';

const ConnectionSelector = memo(() => {
  const dispatch = useAppDispatch();
  const connections = useAppSelector(selectAllConnections);
  const activeConnection = useAppSelector(selectActiveConnection);
  const [isOpen, setIsOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  useConnectionStatusSync();

  const isConnected = useMemo(
    () => activeConnection?.status === ConnectionStatus.CONNECTED,
    [activeConnection?.status],
  );

  const handleSelectConnection = useCallback(
    (connectionId: string) => {
      dispatch(setActiveConnection(connectionId));
      setIsOpen(false);
    },
    [dispatch],
  );

  const handleManageConnections = useCallback(() => {
    setIsOpen(false);
    setIsManageDialogOpen(true);
  }, []);

  const handleCloseManageDialog = useCallback(() => {
    setIsManageDialogOpen(false);
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            transition-colors duration-200 ease-out
            focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/30
            ${
              isOpen
                ? ' bg-monitor-panel/55 text-white ring-1 ring-emerald-400/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }
          `}
          aria-label="Toggle connections menu"
          aria-expanded={isOpen}
        >
          <LuPlug2 className="w-4 h-4 text-emerald-400" />
          <span className="font-small text-ui hidden sm:inline">
            {activeConnection?.name || 'No connection'}
          </span>
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
          )}
          <FaChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="
          w-72 bg-monitor-surface ring-1 ring-monitor-line rounded-xl shadow-none p-2 z-50
          data-[state=open]:animate-popoverShow
          data-[state=closed]:animate-popoverHide
        "
        sideOffset={5}
      >
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-400">
          CONNECTIONS
        </div>

        {connections.length === 0 ? (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            No connections configured
          </div>
        ) : (
          <div className="space-y-1">
            {connections.map((conn) => (
              <button
                key={conn.id}
                onClick={() => handleSelectConnection(conn.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                  transition-colors duration-150
                  ${
                    activeConnection?.id === conn.id
                      ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-400/20'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium">{conn.name}</div>
                  <div className="text-xs text-gray-500">{conn.address}</div>
                </div>
                <div className="flex items-center gap-2">
                  {activeConnection?.id === conn.id && (
                    <Badge
                      variant="success"
                      className="text-[8px] px-1.5 py-0 h-4"
                    >
                      ✓
                    </Badge>
                  )}
                  <span
                    className={`w-2 h-2 rounded-full ${getConnectionStatusClass(conn.status)}`}
                  />
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-monitor-line">
          <button
            onClick={handleManageConnections}
            className="w-full px-3 py-2 text-sm text-left text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Manage connections...
          </button>
        </div>
      </PopoverContent>

      <ManageConnectionsDialog
        isOpen={isManageDialogOpen}
        onClose={handleCloseManageDialog}
      />
    </Popover>
  );
});

ConnectionSelector.displayName = 'ConnectionSelector';

export default ConnectionSelector;
