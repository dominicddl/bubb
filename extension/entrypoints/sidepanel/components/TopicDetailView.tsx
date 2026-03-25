import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './EmptyState';
import { NoteListItem } from './NoteListItem';
import { useTopicNotes } from '../hooks/useNotes';

interface TopicDetailViewProps {
  topicId: string;
  topicName: string;
  onBack: () => void;
}

export function TopicDetailView({ topicId, topicName, onBack }: TopicDetailViewProps) {
  const { data: notes, isLoading, error } = useTopicNotes(topicId);

  const noteCount = notes?.length ?? 0;
  const noteLabel = noteCount === 1 ? '1 note' : `${noteCount} notes`;

  return (
    <div
      className="flex flex-col flex-1"
      style={{ animation: 'slideInFromRight 200ms ease-out' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 shrink-0"
        style={{
          padding: '12px 28px',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to topics"
          className="flex items-center justify-center rounded-md hover:opacity-60 transition-opacity shrink-0"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-baseline gap-2 min-w-0">
          <span
            className="text-[17px] font-semibold truncate"
            style={{ color: 'hsl(24 10% 16%)', fontFamily: 'var(--font-sans)' }}
          >
            {topicName}
          </span>
          {!isLoading && (
            <span
              className="text-[11px] shrink-0"
              style={{ color: 'hsl(24 5% 52%)', fontFamily: 'var(--font-mono)' }}
            >
              {noteLabel}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-2 px-7 py-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <EmptyState
          heading="Could not load notes"
          body="Check your connection and try again."
        />
      ) : notes && notes.length > 0 ? (
        <ScrollArea className="flex-1">
          {notes.map((note) => (
            <NoteListItem key={note.id} note={note} showSourceUrl={true} />
          ))}
        </ScrollArea>
      ) : (
        <EmptyState
          heading="No notes in this topic"
          body="Notes assigned to this topic will appear here."
        />
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
