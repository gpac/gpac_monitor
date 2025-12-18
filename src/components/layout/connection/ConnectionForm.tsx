import { memo, useCallback, ChangeEvent, useState } from 'react';
import { Input } from '@/components/ui/input';
import { LuPlus, LuSave, LuX } from 'react-icons/lu';

interface FormData {
  name: string;
  address: string;
}

interface ConnectionFormProps {
  initialData?: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
}

export const ConnectionForm = memo(
  ({ initialData, onSave, onCancel }: ConnectionFormProps) => {
    const [name, setName] = useState(initialData?.name || '');
    const [address, setAddress] = useState(initialData?.address || '');

    const handleNameChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value),
      [],
    );

    const handleAddressChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => setAddress(e.target.value),
      [],
    );

    const handleSubmit = useCallback(() => {
      if (name && address) onSave({ name, address });
    }, [name, address, onSave]);

    const isValid = Boolean(name && address);

    return (
      <div className="space-y-3 pt-4 border-t border-monitor-line">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-400">
            {initialData ? 'EDIT CONNECTION' : 'ADD CONNECTION'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-white rounded transition-colors"
            aria-label="Cancel"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <Input
            value={name}
            onChange={handleNameChange}
            placeholder="Connection name"
            className="bg-monitor-panel border-monitor-line text-white"
          />
          <Input
            value={address}
            onChange={handleAddressChange}
            placeholder="ws://localhost:6363"
            className="bg-monitor-panel border-monitor-line text-white"
          />

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {initialData ? (
              <LuSave className="w-4 h-4" />
            ) : (
              <LuPlus className="w-4 h-4" />
            )}
            {initialData ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    );
  },
);

ConnectionForm.displayName = 'ConnectionForm';
