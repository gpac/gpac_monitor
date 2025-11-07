import { useEffect, useRef, memo, useMemo } from 'react';

export type SidebarCloseButtonProps = {
  onClose: () => void;
};

// Memoize CSS classes to avoid recreation
const BUTTON_CLASSES =
  'group fixed left-52 top-12 z-20 will-change-transform ' +
  'rounded-full border border-slate-700/40 ring-1 ring-slate-700/50 shadow-lg ' +
  'bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-sm ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 ' +
  'motion-safe:transition-[transform,background-color] motion-safe:duration-200 active:scale-[0.98]';

const PASTILLE_CLASSES =
  'absolute inset-0 rounded-full bg-gradient-to-b from-slate-700/70 to-slate-900/70 border border-slate-600/40';

const HALO_CLASSES =
  'pointer-events-none absolute inset-0 rounded-full ring-2 ring-violet-500/15 group-hover:ring-violet-400/25 motion-safe:transition';

const ICON_CLASSES =
  'relative h-5 w-5 text-slate-200 transform group-hover:-translate-x-0.5 motion-safe:transition-transform';

const SidebarCloseButton = memo<SidebarCloseButtonProps>(({ onClose }) => {
  const onCloseRef = useRef(onClose);

  // Keep ref updated without triggering re-renders
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Keyboard shortcut: Ctrl/Cmd + B to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onCloseRef.current?.();
      }
    };
    window.addEventListener('keydown', handler, { capture: false });
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Memoize SVG to prevent recreation
  const chevronIcon = useMemo(
    () => (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={ICON_CLASSES}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    ),
    [],
  );

  return (
    <button
      onClick={() => onCloseRef.current?.()}
      className={BUTTON_CLASSES}
      aria-label="Close sidebar"
      title="Close sidebar • Ctrl/⌘ + B"
      aria-controls="app-sidebar"
      aria-expanded={true}
    >
      <div className="relative h-9 w-9 grid place-items-center rounded-full select-none">
        <div className={PASTILLE_CLASSES} />
        <span className={HALO_CLASSES} />
        {chevronIcon}
      </div>
    </button>
  );
});

SidebarCloseButton.displayName = 'SidebarCloseButton';

export default SidebarCloseButton;
