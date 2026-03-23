import { useState, useRef } from 'react';
import { LuClapperboard, LuX } from 'react-icons/lu';

interface HistoryLoaderProps {
  onHistoryLoadFull: (snapshotFile: File, eventsFile: File) => void;
}

const HistoryLoader = ({ onHistoryLoadFull }: HistoryLoaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshotFile, setSnapshotFile] = useState<File | null>(null);
  const [eventsFile, setEventsFile] = useState<File | null>(null);
  const snapshotInputRef = useRef<HTMLInputElement>(null);
  const eventsInputRef = useRef<HTMLInputElement>(null);

  const handleSnapshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSnapshotFile(file);
    if (file && eventsFile) {
      onHistoryLoadFull(file, eventsFile);
      reset();
    }
  };

  const handleEventsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setEventsFile(file);
    if (snapshotFile && file) {
      onHistoryLoadFull(snapshotFile, file);
      reset();
    }
  };

  const reset = () => {
    setSnapshotFile(null);
    setEventsFile(null);
    setIsOpen(false);
    if (snapshotInputRef.current) snapshotInputRef.current.value = '';
    if (eventsInputRef.current) eventsInputRef.current.value = '';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
        title="Load history"
        aria-label="Load history"
      >
        <LuClapperboard className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-10 left-0 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 p-3 flex flex-col gap-2 min-w-52">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 font-ui">Load history</span>
            <button onClick={reset} className="text-gray-500 hover:text-white">
              <LuX className="w-3 h-3" />
            </button>
          </div>

          <FileRow
            label="snapshot.json"
            file={snapshotFile}
            accept=".json"
            inputRef={snapshotInputRef}
            onChange={handleSnapshotChange}
          />
          <FileRow
            label="events.jsonl"
            file={eventsFile}
            accept=".jsonl"
            inputRef={eventsInputRef}
            onChange={handleEventsChange}
          />
        </div>
      )}
    </div>
  );
};

interface FileRowProps {
  label: string;
  file: File | null;
  accept: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileRow = ({ label, file, accept, inputRef, onChange }: FileRowProps) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => inputRef.current?.click()}
      className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white whitespace-nowrap"
    >
      {label}
    </button>
    <span className="text-xs text-gray-500 truncate max-w-28">
      {file ? file.name : '—'}
    </span>
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      className="hidden"
      onChange={onChange}
    />
  </div>
);

export default HistoryLoader;
