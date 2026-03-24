interface ChatMessageProps {
  text: string;
  isStreaming: boolean;
  role: 'user' | 'assistant';
}

export function ChatMessage({ text, isStreaming, role }: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="text-[14px] font-medium leading-[1.5] text-[hsl(var(--foreground))] bg-[hsl(var(--accent-coral-light))] rounded-[8px] px-[12px] py-[6px] self-end max-w-[85%]">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="text-[14px] leading-[1.6] text-[hsl(var(--foreground))]">
      {text}
      {isStreaming && (
        <span
          className="inline-block w-[2px] h-[14px] bg-[hsl(var(--foreground))] ml-[1px]"
          style={{ animation: 'blink-cursor 1s step-end infinite' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
