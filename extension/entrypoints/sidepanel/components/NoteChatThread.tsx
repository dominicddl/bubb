import type { ConversationTurn } from '@/lib/messaging';

interface NoteChatThreadProps {
  turns: ConversationTurn[];
}

export function NoteChatThread({ turns }: NoteChatThreadProps) {
  if (turns.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 mt-2 pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
      <span
        className="text-[11px] font-medium tracking-wide uppercase"
        style={{ color: 'hsl(24 5% 52%)', fontFamily: 'var(--font-mono)' }}
      >
        Follow-up questions
      </span>
      {turns.map((turn, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <p
            className="text-[12px] font-medium"
            style={{ color: 'hsl(24 8% 28%)', fontFamily: 'var(--font-sans)' }}
          >
            Q: {turn.question}
          </p>
          <p
            className="text-[12px]"
            style={{ color: 'hsl(24 5% 42%)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}
          >
            {turn.answer}
          </p>
        </div>
      ))}
    </div>
  );
}
