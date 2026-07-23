import { type CSSProperties } from 'react';

interface GraphRadioProps {
  active: boolean;
  onClick: () => void;
  label: string;
  /** When active, tints the dot with the series color; defaults to text-info. */
  color?: string;
}

function GraphRadio({ active, onClick, label, color }: GraphRadioProps) {
  const style: CSSProperties | undefined =
    active && color ? { color } : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Graph ${label}`}
      title="Select for temporal graph"
      style={style}
      className={`align-middle text-[0.786rem] leading-none transition-colors ${
        active ? 'text-info' : 'text-muted-foreground/50 hover:text-info'
      }`}
    >
      {active ? '◉' : '○'}
    </button>
  );
}

export default GraphRadio;
