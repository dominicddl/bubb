import type { ConversationTurn } from '@/lib/messaging';
import { ChatMessage } from './ChatMessage';

interface ChatThreadProps {
  turns: Array<ConversationTurn & { isStreaming: boolean }>;
  followUpCapReached: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatThread({ turns, followUpCapReached, bottomRef }: ChatThreadProps) {
  return (
    <div className="flex flex-col gap-[8px] px-[16px] py-[8px]">
      {turns.map((turn, index) => (
        <div key={index} className="flex flex-col gap-[4px]">
          <ChatMessage role="user" text={turn.question} isStreaming={false} />
          <ChatMessage role="assistant" text={turn.answer} isStreaming={turn.isStreaming} />
        </div>
      ))}
      {followUpCapReached && (
        <p className="text-[12px] text-[hsl(var(--muted-foreground))] text-center py-[8px]">
          Start a new highlight for more questions
        </p>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
