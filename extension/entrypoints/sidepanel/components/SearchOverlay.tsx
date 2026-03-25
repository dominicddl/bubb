import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from './EmptyState';
import { NoteListItem } from './NoteListItem';
import { useSidePanelStore } from '../stores/sidePanelStore';
import { useSearch } from '../hooks/useSearch';

export function SearchOverlay() {
  const { searchQuery, setSearchQuery, closeSearch } = useSidePanelStore();
  const { data: results, error } = useSearch(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle Escape key to dismiss search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSearch();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeSearch]);

  return (
    <div
      className="flex flex-col flex-1"
      style={{ animation: 'slideInFromRight 200ms ease-out' }}
    >
      {/* Search bar */}
      <div
        className="flex items-center gap-2 px-4 shrink-0"
        style={{
          height: '48px',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <button
          type="button"
          onClick={closeSearch}
          className="flex items-center justify-center rounded-md hover:opacity-60 transition-opacity shrink-0"
          style={{ color: 'hsl(24 6% 40%)' }}
          aria-label="Close search"
        >
          <ArrowLeft size={20} />
        </button>

        <Input
          ref={inputRef}
          type="search"
          aria-label="Search notes"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          className="text-[13px] h-8 border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 bg-transparent"
          style={{ fontFamily: 'var(--font-sans)' }}
        />
      </div>

      {/* Results area */}
      {searchQuery.length < 2 ? (
        <div className="flex flex-1 items-center justify-center">
          <p
            className="text-[11px] text-center px-7"
            style={{ color: 'hsl(24 5% 52%)', fontFamily: 'var(--font-sans)' }}
          >
            Type at least 2 characters to search
          </p>
        </div>
      ) : error ? (
        <EmptyState
          heading="Search unavailable right now"
          body="Try again in a moment."
        />
      ) : results && results.length === 0 ? (
        <EmptyState
          heading={`No notes match "${searchQuery}"`}
          body="Try a different keyword or broaden your search."
        />
      ) : results && results.length > 0 ? (
        <ScrollArea className="flex-1">
          {results.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              showSourceUrl={true}
              searchQuery={searchQuery}
            />
          ))}
        </ScrollArea>
      ) : (
        // Loading state — results appear inline as they load
        <div className="flex flex-1 items-center justify-center">
          <p
            className="text-[11px]"
            style={{ color: 'hsl(24 5% 52%)', fontFamily: 'var(--font-mono)' }}
          >
            Searching...
          </p>
        </div>
      )}

      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
