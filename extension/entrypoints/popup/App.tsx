import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageType } from '@/lib/messaging';
import type { AuthResponse } from '@/lib/messaging';

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
      <div className="w-[280px] p-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-[280px] p-4">
      <h1 className="text-lg font-semibold mb-2">bubb</h1>
      {isAuthenticated ? (
        <p className="text-sm text-muted-foreground">
          Open the side panel to view your learning dashboard.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to save explanations and sync across devices.
          </p>
          <Button
            size="sm"
            className="min-h-[44px] w-full"
            onClick={async () => {
              // Open side panel where the full sign-in flow lives
              const currentWindow = await chrome.windows.getCurrent();
              if (currentWindow.id != null) {
                chrome.sidePanel.open({ windowId: currentWindow.id });
              }
            }}
          >
            Sign in with Google
          </Button>
        </>
      )}
    </div>
  );
}

export default App;
