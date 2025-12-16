import { useState, useCallback, memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import { selectAllConnections } from '@/shared/store/selectors';
import {
  addConnection,
  removeConnection,
} from '@/shared/store/slices/connectionsSlice';
import { GpacConnectionConfig } from '@/types/connection';
import { getConnectionStatusClass } from '@/utils/connectionStatus';
import { generateID } from '@/utils/core/id';
import { LuTrash2, LuPlus } from 'react-icons/lu';

interface ManageConnectionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageConnectionsDialog = memo(
  ({ isOpen, onClose }: ManageConnectionsDialogProps) => {
    const dispatch = useAppDispatch();
    const connections = useAppSelector(selectAllConnections);

    const [newConnection, setNewConnection] = useState({
      name: '',
      address: '',
      type: 'local' as 'local' | 'remote',
    });

    const handleAddConnection = useCallback(() => {
      if (!newConnection.name || !newConnection.address) {
        return;
      }

      const connection: GpacConnectionConfig = {
        id: generateID('conn'),
        name: newConnection.name,
        address: newConnection.address,
        type: newConnection.type,
      };

      dispatch(addConnection(connection));
      setNewConnection({ name: '', address: '', type: 'local' });
    }, [dispatch, newConnection]);

    const handleRemoveConnection = useCallback(
      (id: string) => {
        dispatch(removeConnection(id));
      },
      [dispatch],
    );

    const handleNameChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewConnection((prev) => ({ ...prev, name: e.target.value }));
      },
      [],
    );

    const handleAddressChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewConnection((prev) => ({ ...prev, address: e.target.value }));
      },
      [],
    );

    const handleTypeChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNewConnection((prev) => ({
          ...prev,
          type: e.target.value as 'local' | 'remote',
        }));
      },
      [],
    );

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-monitor-surface border-monitor-line max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Manage Connections</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add, edit, or remove GPAC connections
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400">
                EXISTING CONNECTIONS
              </h3>
              {connections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No connections yet
                </div>
              ) : (
                <div className="space-y-2">
                  {connections.map((conn) => (
                    <div
                      key={conn.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-monitor-panel/30 border border-monitor-line"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${getConnectionStatusClass(conn.status)}`}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {conn.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {conn.address}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveConnection(conn.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        aria-label={`Delete ${conn.name}`}
                      >
                        <LuTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-monitor-line">
              <h3 className="text-sm font-semibold text-gray-400">
                ADD NEW CONNECTION
              </h3>

              <div className="grid gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Name
                  </label>
                  <Input
                    value={newConnection.name}
                    onChange={handleNameChange}
                    placeholder="Local GPAC"
                    className="bg-monitor-panel border-monitor-line text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    WebSocket Address
                  </label>
                  <Input
                    value={newConnection.address}
                    onChange={handleAddressChange}
                    placeholder="ws://localhost:6363"
                    className="bg-monitor-panel border-monitor-line text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Type
                  </label>
                  <select
                    value={newConnection.type}
                    onChange={handleTypeChange}
                    className="w-full h-9 px-3 bg-monitor-panel border border-monitor-line rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400/30"
                  >
                    <option value="local">Local</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>

                <button
                  onClick={handleAddConnection}
                  disabled={!newConnection.name || !newConnection.address}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <LuPlus className="w-4 h-4" />
                  Add Connection
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);

ManageConnectionsDialog.displayName = 'ManageConnectionsDialog';

export default ManageConnectionsDialog;
