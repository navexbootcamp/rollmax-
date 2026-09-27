import React, { useEffect, useRef } from 'react';
import { INSTAGRAM_URL } from '../constants/config';

interface TopBarProps {
  onTriggerCreator: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onTriggerCreator }) => {
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  const handleSecretTap = () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 2500) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      onTriggerCreator();
    }
  };

  // Keyboard shortcut listener: Alt+C, Ctrl+Shift+C, or Ctrl/Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.altKey && e.key.toLowerCase() === 'c') ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        onTriggerCreator();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTriggerCreator]);

  return (
    <header className="relative z-30 w-full px-6 sm:px-12 pt-6 sm:pt-8 flex items-center justify-between select-none">
      {/* Creator signature matching screenshot exactly */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 text-xs font-mono-tabular tracking-wider text-neutral-600 hover:text-black transition-colors duration-150"
      >
        <span className="text-neutral-500 font-light">made by</span>
        <span className="font-semibold text-neutral-800 group-hover:text-black">
          wow_navex
        </span>
        <span className="text-neutral-600 inline-block transform transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          ↗
        </span>
      </a>

      {/* Understated product identifier from screenshot: TOPIC ROLLER / 001 */}
      <div
        onClick={handleSecretTap}
        className="text-xs font-mono-tabular tracking-widest text-neutral-500 uppercase font-normal cursor-default select-none"
      >
        TOPIC ROLLER / 001
      </div>
    </header>
  );
};
