import { Search } from 'lucide-react';
import { BubbLogo } from '@/components/BubbLogo';
import { useSidePanelStore } from '../stores/sidePanelStore';

interface SidePanelHeaderProps {
  userName: string;
}

export function SidePanelHeader({ userName }: SidePanelHeaderProps) {
  const toggleSearch = useSidePanelStore((s) => s.toggleSearch);

  const parts = userName.split(' ');
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : userName.slice(0, 2).toUpperCase();

  return (
    <div
      className="flex items-center justify-between px-4 shrink-0"
      style={{ height: '48px', borderBottom: '1px solid hsl(var(--border))' }}
    >
      {/* Left: Logo + name */}
      <div className="flex items-center gap-2">
        <BubbLogo size={28} />
        <span
          className="text-[17px] font-semibold tracking-[-0.01em]"
          style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 10% 16%)' }}
        >
          bubb
        </span>
      </div>

      {/* Right: search + avatar */}
      <div className="flex items-center gap-2.5">
        {/* Search icon button */}
        <button
          type="button"
          onClick={toggleSearch}
          className="flex items-center justify-center rounded-md transition-colors hover:opacity-60"
          style={{ color: 'hsl(24 6% 40%)' }}
          aria-label="Search notes"
        >
          <Search size={18} />
        </button>

        {/* User avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium tracking-wide shrink-0"
          style={{
            background: 'hsl(24 8% 16%)',
            color: 'hsl(33 25% 90%)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}
