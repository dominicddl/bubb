import { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import type { Provider } from '@/lib/messaging';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PopupFooterProps {
  onSendFollowUp: (question: string) => void;
  isStreaming: boolean;
  followUpCapReached: boolean;
  activeProvider: Provider;
  onProviderChange: (provider: Provider) => void;
}

export function PopupFooter({
  onSendFollowUp,
  isStreaming,
  followUpCapReached,
  activeProvider,
  onProviderChange,
}: PopupFooterProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim() || isStreaming) return;
    onSendFollowUp(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && !isStreaming) {
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-[8px] border-t border-[hsl(var(--border))] px-[16px] py-[8px]">
      {!followUpCapReached && (
        <>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up..."
            disabled={isStreaming}
            className={`flex-1 bg-transparent text-[12px] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none ${isStreaming ? 'cursor-not-allowed opacity-50' : ''}`}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !inputValue.trim()}
            aria-label="Send follow-up question"
            className={`flex items-center justify-center w-[24px] h-[24px] rounded-full transition-colors ${
              isStreaming || !inputValue.trim()
                ? 'text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--accent-coral))]'
            }`}
          >
            <ArrowUp className="w-[16px] h-[16px]" />
          </button>
        </>
      )}
      <Select
        value={activeProvider}
        onValueChange={(v) => onProviderChange(v as Provider)}
        disabled={isStreaming}
      >
        <SelectTrigger className="h-[24px] w-auto border-0 bg-transparent px-[4px] text-[12px] text-[hsl(var(--muted-foreground))] shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="openai">GPT-4o mini</SelectItem>
          <SelectItem value="anthropic">Claude Haiku</SelectItem>
          <SelectItem value="google">Gemini Flash</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
