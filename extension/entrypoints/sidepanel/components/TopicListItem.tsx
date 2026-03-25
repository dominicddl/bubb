import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Topic } from '../hooks/useTopics';

interface TopicListItemProps {
  topic: Topic;
  onSelect: (id: string, name: string) => void;
}

export function TopicListItem({ topic, onSelect }: TopicListItemProps) {
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
      className="flex items-center justify-between cursor-pointer"
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

      {/* Right: chevron */}
      <ChevronRight
        size={16}
        style={{ color: 'hsl(24 5% 52%)', flexShrink: 0 }}
      />
    </div>
  );
}
