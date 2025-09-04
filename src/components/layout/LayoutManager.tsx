import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLayoutManager } from '@/shared/hooks/useLayoutManager';

export const LayoutManager = () => {
  const [layoutName, setLayoutName] = useState('');
  const { save, load, remove, getLayoutNames } = useLayoutManager();

  const handleSave = () => {
    if (layoutName.trim()) {
      save(layoutName.trim());
      setLayoutName('');
    }
  };

  const handleLoad = (name: string) => {
    load(name);
  };

  const handleDelete = (name: string) => {
    remove(name);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Layout name"
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <Button onClick={handleSave} disabled={!layoutName.trim()}>
          Save
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Saved layouts:</h3>
        {getLayoutNames().map((name) => (
          <div key={name} className="flex gap-2 items-center">
            <span className="flex-1 text-sm text-muted-foreground text-gray-400">{name}</span>
            <Button size="sm" variant="outline" onClick={() => handleLoad(name)}>
              Load
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(name)}>
              Delete
            </Button>
          </div>
        ))}
        {getLayoutNames().length === 0 && (
          <p className="text-sm text-muted-foreground text-gray-400">No saved layouts</p>
        )}
      </div>
    </div>
  );
};