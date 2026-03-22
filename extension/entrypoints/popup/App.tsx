import { useState, useEffect } from 'react';
import { MessageType } from '@/lib/messaging';
import type { AuthResponse } from '@/lib/messaging';
import { ArrowRight } from 'lucide-react';
import { BubbLogo } from '@/components/BubbLogo';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    chrome.runtime
      .sendMessage({ type: MessageType.GET_AUTH_STATE })
      .then((response: AuthResponse) => {
        setIsAuthenticated(response.isAuthenticated ?? false);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="w-[280px] p-5">
        <div className="flex items-center gap-2 animate-pulse">
          <BubbLogo size={22} />
          <p
            className="text-[15px] font-semibold tracking-[-0.01em]"
            style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 10% 16%)' }}
          >
            bubb
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[280px] p-5">
      <div className="flex items-center gap-2 mb-4">
        <BubbLogo size={22} />
        <p
          className="text-[15px] font-semibold tracking-[-0.01em]"
          style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 10% 16%)' }}
        >
          bubb
        </p>
      </div>

      {isAuthenticated ? (
        <div>
          <span
            className="text-[9px] font-medium tracking-[0.15em] uppercase block mb-2"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'hsl(var(--accent-green))',
            }}
          >
            [ READY ]
          </span>
          <p
            className="text-[12.5px] leading-[1.6]"
            style={{ color: 'hsl(24 6% 46%)' }}
          >
            Open the side panel to view your learning dashboard.
          </p>
        </div>
      ) : (
        <div>
          <span
            className="text-[9px] font-medium tracking-[0.15em] uppercase block mb-2"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'hsl(var(--accent-gold))',
            }}
          >
            [ SIGN IN ]
          </span>
          <p
            className="text-[12.5px] leading-[1.6] mb-4"
            style={{ color: 'hsl(24 6% 46%)' }}
          >
            Sign in to save explanations and sync across devices.
          </p>
          <button
            className="group flex items-center justify-between w-full h-[42px] rounded-lg px-4 transition-opacity hover:opacity-90"
            style={{
              background: 'hsl(24 8% 16%)',
              color: 'hsl(33 26% 95%)',
            }}
            onClick={async () => {
              const currentWindow = await chrome.windows.getCurrent();
              if (currentWindow.id != null) {
                chrome.sidePanel.open({ windowId: currentWindow.id });
              }
            }}
          >
            <span
              className="text-[12px] font-medium"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Sign in with Google
            </span>
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center transition-transform group-hover:translate-x-0.5"
              style={{ background: 'hsl(var(--accent-coral))' }}
            >
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
