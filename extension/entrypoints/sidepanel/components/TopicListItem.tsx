import { ChevronRight, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Topic } from '../hooks/useTopics';

interface TopicListItemProps {
  topic: Topic;
  onSelect: (id: string, name: string) => void;
  onDelete?: (topicId: string) => void;
}

export function TopicListItem({ topic, onSelect, onDelete }: TopicListItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(topic.id, topic.name)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(topic.id, topic.name);
        }
      }}
      className="flex items-center justify-between cursor-pointer group"
      style={{
        padding: '8px 28px',
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      {/* Left: topic name + badge */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-[13px] font-semibold truncate"
          style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
        >
          {topic.name}
        </span>
        <Badge
          variant="secondary"
          className="shrink-0 text-[11px] px-1.5 py-0"
          style={{ color: 'hsl(var(--accent-green))' }}
        >
          {topic.note_count}
        </Badge>
      </div>

      {/* Right: delete + chevron */}
      <div className="flex items-center gap-1 shrink-0">
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(topic.id);
            }}
            aria-label="Delete topic"
            className="flex items-center justify-center w-[22px] h-[22px] rounded opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-[hsl(var(--muted))] transition-all"
            style={{ color: 'hsl(24 5% 52%)' }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
        <ChevronRight
          size={16}
          style={{ color: 'hsl(24 5% 52%)', flexShrink: 0 }}
        />
      </div>
    </div>
  );
}
