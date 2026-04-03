import { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import type { Provider } from '@/lib/messaging';
import { ProviderDropdown } from './ProviderDropdown';

interface PopupFooterProps {
  onSendFollowUp: (question: string) => void;
  isStreaming: boolean;
  followUpCapReached: boolean;
  activeProvider: Provider;
  onProviderChange: (provider: Provider) => void;
  pulse?: boolean;
}

export function PopupFooter({
  onSendFollowUp,
  isStreaming,
  followUpCapReached,
  activeProvider,
  onProviderChange,
  pulse,
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
    <div className={`flex items-center gap-[8px] border-t border-[hsl(var(--border))] px-[16px] py-[8px]${pulse ? ' animate-[onboardingPulse_1.5s_ease-in-out_infinite]' : ''}`} style={pulse ? { background: 'hsl(4 58% 58% / 0.06)' } : undefined}>
      {pulse && <style>{`@keyframes onboardingPulse { 0%, 100% { background: hsl(4 58% 58% / 0.08); } 50% { background: hsl(4 58% 58% / 0.02); } }`}</style>}
      {!followUpCapReached ? (
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
      ) : (
        <span className="flex-1 text-[11px] text-[hsl(var(--muted-foreground))]">Follow-up limit reached</span>
      )}
      <ProviderDropdown
        activeProvider={activeProvider}
        onProviderChange={onProviderChange}
        disabled={isStreaming}
      />
    </div>
  );
}
