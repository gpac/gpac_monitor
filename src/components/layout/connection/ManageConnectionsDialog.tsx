import { useState, useCallback, memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import { selectAllConnections } from '@/shared/store/selectors';
import {
  addConnection,
  removeConnection,
  updateConnection,
} from '@/shared/store/slices/connectionsSlice';
import { getConnectionStatusClass } from '@/utils/connectionStatus';
import { generateID } from '@/utils/core/id';
import { LuTrash2, LuPlus } from 'react-icons/lu';
import { ConnectionForm } from './ConnectionForm';

interface ManageConnectionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageConnectionsDialog = memo(
  ({ isOpen, onClose }: ManageConnectionsDialogProps) => {
    const dispatch = useAppDispatch();
    const connections = useAppSelector(selectAllConnections);
    const [mode, setMode] = useState<
      'list' | 'add' | { type: 'edit'; id: string }
    >('list');

    const handleAdd = useCallback(() => setMode('add'), []);
    const handleEdit = useCallback(
      (id: string) => setMode({ type: 'edit', id }),
      [],
    );
    const handleCancel = useCallback(() => setMode('list'), []);

    const handleSave = useCallback(
      (data: { name: string; address: string }) => {
        const payload = { ...data, type: 'local' as const };
        if (typeof mode === 'object' && mode.type === 'edit') {
          dispatch(updateConnection({ id: mode.id, ...payload }));
        } else {
          dispatch(addConnection({ id: generateID('conn'), ...payload }));
        }
        setMode('list');
      },
      [dispatch, mode],
    );

    const handleDelete = useCallback(
      (id: string) => dispatch(removeConnection(id)),
      [dispatch],
    );

    const editingConnection =
      typeof mode === 'object' && mode.type === 'edit'
        ? connections.find((c) => c.id === mode.id)
        : null;

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-monitor-surface border-monitor-line max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Connections</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {mode === 'list' && (
              <>
                {connections.length > 0 && (
                  <div className="space-y-2">
                    {connections.map((conn) => (
                      <div
                        key={conn.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-monitor-panel/30 border border-monitor-line group"
                      >
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${getConnectionStatusClass(conn.status)}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {conn.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {conn.address}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(conn.id)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            aria-label={`Edit ${conn.name}`}
                          >
                            <LuPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(conn.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            aria-label={`Delete ${conn.name}`}
                          >
                            <LuTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleAdd}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                >
                  <LuPlus className="w-4 h-4" />
                  Add Connection
                </button>
              </>
            )}

            {mode !== 'list' && (
              <ConnectionForm
                initialData={
                  editingConnection
                    ? {
                        name: editingConnection.name,
                        address: editingConnection.address,
                      }
                    : undefined
                }
                onSave={handleSave}
                onCancel={handleCancel}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);

ManageConnectionsDialog.displayName = 'ManageConnectionsDialog';

export default ManageConnectionsDialog;
