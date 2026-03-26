import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { MessageType } from '@/lib/messaging';

interface TopicSuggestionChipProps {
  noteId: string;
  suggestedTopic: string;
  isExisting: boolean;
  existingTopicId: string | null;
  onComplete: () => void;
}

type Mode = 'chip' | 'editing' | 'saving' | 'done';

export function TopicSuggestionChip({
  noteId,
  suggestedTopic,
  isExisting,
  existingTopicId,
  onComplete,
}: TopicSuggestionChipProps) {
  const [mode, setMode] = useState<Mode>('chip');
  const [editValue, setEditValue] = useState(suggestedTopic);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'editing' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [mode]);

  async function assignTopic(topicName: string, knownTopicId: string | null) {
    setMode('saving');
    try {
      let topicId = knownTopicId;
      if (!topicId) {
        // Create new topic — RLS requires user_id = auth.uid()
        const { data: { session } } = await getSupabase().auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          console.error('[bubb] No session for topic creation');
          setMode('done');
          onComplete();
          return;
        }
        const { data } = await getSupabase()
          .from('topics')
          .insert({ name: topicName, user_id: userId })
          .select('id')
          .single();
        topicId = data?.id ?? null;
      }
      if (topicId) {
        // Assign topic to note via RPC (atomically updates topic_id + note_count)
        // Do NOT call .update({ topic_id }) separately — the RPC handles everything
        await getSupabase().rpc('assign_topic_to_note', {
          p_note_id: noteId,
          p_topic_id: topicId,
        });
        // Broadcast to side panel
        chrome.runtime.sendMessage({
          type: MessageType.TOPIC_ASSIGNED,
          payload: { noteId, topicId },
        }).catch(() => {});
      }
      setMode('done');
      onComplete();
    } catch (err) {
      console.error('[bubb] Topic assignment failed:', err);
      setMode('done');
      onComplete();
    }
  }

  async function handleAccept() {
    await assignTopic(suggestedTopic, existingTopicId);
  }

  async function handleEditConfirm() {
    const trimmed = editValue.trim();
    if (!trimmed) {
      onComplete();
      return;
    }

    setMode('saving');
    try {
      // Check if editValue matches an existing topic (case-insensitive)
      const { data: matches } = await getSupabase()
        .from('topics')
        .select('id')
        .ilike('name', trimmed)
        .limit(1);

      const matchedId = matches?.[0]?.id ?? null;
      await assignTopic(trimmed, matchedId);
    } catch (err) {
      console.error('[bubb] Topic lookup failed:', err);
      await assignTopic(trimmed, null);
    }
  }

  function handleSkip() {
    onComplete();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditConfirm();
    } else if (e.key === 'Escape') {
      setMode('chip');
      setEditValue(suggestedTopic);
    }
  }

  if (mode === 'done') return null;

  return (
    <div
      className="flex items-center justify-between border-t border-[hsl(var(--border))] px-[16px] py-[8px] animate-[fadeSlideUp_200ms_ease-out]"
    >
      <span className="text-[11px] text-[hsl(var(--muted-foreground))] shrink-0 mr-[6px]">
        Topic:
      </span>

      {mode === 'saving' ? (
        <div className="flex flex-1 items-center gap-[6px]">
          <span
            className="inline-flex items-center px-[8px] py-[3px] rounded-full text-[11px] font-semibold text-[hsl(var(--foreground))] border border-[hsl(var(--accent-gold))]"
            style={{ background: 'hsl(38 60% 52% / 0.12)' }}
          >
            {editValue || suggestedTopic}
          </span>
          <div className="w-3 h-3 border-2 border-[hsl(var(--muted-foreground))] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mode === 'editing' ? (
        <div className="flex flex-1 items-center gap-[6px]">
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-[13px] px-[8px] py-[3px] rounded-full border border-[hsl(var(--accent-gold))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] outline-none min-w-0"
            style={{ background: 'hsl(38 60% 52% / 0.06)' }}
          />
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-[6px]">
          <span
            className="inline-flex items-center px-[8px] py-[3px] rounded-full text-[11px] font-semibold text-[hsl(var(--foreground))] border border-[hsl(var(--accent-gold))] truncate max-w-[160px]"
            style={{ background: 'hsl(38 60% 52% / 0.12)' }}
          >
            {suggestedTopic}
          </span>
          {isExisting && (
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">existing</span>
          )}
        </div>
      )}

      {mode !== 'saving' && (
        <div className="flex items-center gap-[4px] shrink-0 ml-[4px]">
          {mode === 'chip' ? (
            <>
              <button
                onClick={handleAccept}
                aria-label="Accept topic"
                className="flex items-center justify-center w-[22px] h-[22px] rounded hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <Check className="w-[14px] h-[14px] text-[hsl(var(--accent-green))]" />
              </button>
              <button
                onClick={() => setMode('editing')}
                aria-label="Edit topic"
                className="flex items-center justify-center w-[22px] h-[22px] rounded hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <Pencil className="w-[14px] h-[14px] text-[hsl(var(--accent-coral))]" />
              </button>
              <button
                onClick={handleSkip}
                aria-label="Skip topic"
                className="flex items-center justify-center w-[22px] h-[22px] rounded hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <X className="w-[14px] h-[14px] text-[hsl(var(--muted-foreground))]" />
              </button>
            </>
          ) : mode === 'editing' ? (
            <>
              <button
                onClick={handleEditConfirm}
                aria-label="Accept topic"
                className="flex items-center justify-center w-[22px] h-[22px] rounded hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <Check className="w-[14px] h-[14px] text-[hsl(var(--accent-green))]" />
              </button>
              <button
                onClick={() => { setMode('chip'); setEditValue(suggestedTopic); }}
                aria-label="Skip topic"
                className="flex items-center justify-center w-[22px] h-[22px] rounded hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <X className="w-[14px] h-[14px] text-[hsl(var(--muted-foreground))]" />
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
