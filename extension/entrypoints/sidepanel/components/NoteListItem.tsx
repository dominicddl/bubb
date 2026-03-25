import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Note } from '../hooks/useNotes';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function highlightText(text: string, query: string): ReactNode {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        style={{
          background: 'hsl(4 58% 58% / 0.15)',
          color: 'hsl(var(--accent-coral))',
          borderRadius: '2px',
        }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

interface NoteListItemProps {
  note: Note;
  showSourceUrl?: boolean;
  searchQuery?: string;
}

export function NoteListItem({ note, showSourceUrl, searchQuery }: NoteListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      role="button"
      aria-expanded={isExpanded}
      tabIndex={0}
      onClick={() => setIsExpanded((prev) => !prev)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsExpanded((prev) => !prev);
        }
      }}
      className="cursor-pointer"
      style={{
        padding: '8px 28px',
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      {/* Line 1: highlighted_text + timestamp */}
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="text-[13px] font-semibold truncate"
          style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
        >
          {searchQuery ? highlightText(note.highlighted_text, searchQuery) : note.highlighted_text}
        </span>
        <span
          className="text-[11px] shrink-0"
          style={{ color: 'hsl(24 5% 52%)', fontFamily: 'var(--font-mono)' }}
        >
          {timeAgo(note.created_at)}
        </span>
      </div>

      {/* Line 2: explanation — truncated when collapsed, full when expanded */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 200ms ease-out',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <p
            className="text-[13px] mt-0.5"
            style={{
              color: 'hsl(24 5% 52%)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 400,
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}
          >
            {searchQuery ? highlightText(note.explanation, searchQuery) : note.explanation}
          </p>

          {/* Source URL link — only in expanded state when showSourceUrl=true */}
          {showSourceUrl && note.source_url && (
            <a
              href={note.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block text-[11px] truncate mt-0.5 hover:underline"
              style={{
                color: 'hsl(var(--accent-coral))',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {note.source_url}
            </a>
          )}
        </div>
      </div>

      {/* Truncated explanation preview when collapsed */}
      {!isExpanded && (
        <p
          className="text-[13px] truncate mt-0.5"
          style={{
            color: 'hsl(24 5% 52%)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {searchQuery ? highlightText(note.explanation, searchQuery) : note.explanation}
        </p>
      )}

      {/* Source URL below collapsed preview when showSourceUrl=true */}
      {!isExpanded && showSourceUrl && note.source_url && (
        <a
          href={note.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block text-[11px] truncate mt-0.5 hover:underline"
          style={{
            color: 'hsl(var(--accent-coral))',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {note.source_url}
        </a>
      )}
    </div>
  );
}
