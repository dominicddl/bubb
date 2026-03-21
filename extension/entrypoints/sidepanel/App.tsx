import { useState, useEffect, useCallback } from 'react';
import { MessageType } from '@/lib/messaging';
import type { AuthResponse, AuthStateChangedMessage } from '@/lib/messaging';
import { SignedOutView } from './components/SignedOutView';
import { SignedInView } from './components/SignedInView';
import { AuthErrorBanner } from './components/AuthErrorBanner';

interface UserInfo {
  id: string;
  email: string;
  name: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check auth state on mount
  useEffect(() => {
    chrome.runtime
      .sendMessage({ type: MessageType.GET_AUTH_STATE })
      .then((response: AuthResponse) => {
        if (response.success) {
          setIsAuthenticated(response.isAuthenticated ?? false);
          setUser(response.user ?? null);
        }
      })
      .catch((err) => {
        console.error('[bubb] Failed to get auth state:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Listen for auth state changes broadcast from background
  useEffect(() => {
    const listener = (message: AuthStateChangedMessage) => {
      if (message.type === MessageType.AUTH_STATE_CHANGED) {
        setIsAuthenticated(message.payload.isAuthenticated);
        setUser(message.payload.user);
        setError(null);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleSignIn = useCallback(async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const response: AuthResponse = await chrome.runtime.sendMessage({
        type: MessageType.SIGN_IN,
      });
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.user ?? null);
      } else {
        // Per D-04: show inline banner with retry on auth failure
        setError(response.error ?? 'Sign-in failed. Check your connection and try again.');
      }
    } catch (err) {
      setError('Sign-in failed. Check your connection and try again.');
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      const response: AuthResponse = await chrome.runtime.sendMessage({
        type: MessageType.SIGN_OUT,
      });
      if (response.success) {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      console.error('[bubb] Sign out failed:', err);
    }
  }, []);

  // Loading state while checking initial auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="px-6 pt-4">
          <AuthErrorBanner
            message={error}
            onRetry={handleSignIn}
            onDismiss={() => setError(null)}
            isRetrying={isSigningIn}
          />
        </div>
      )}

      {isAuthenticated && user ? (
        <SignedInView
          userName={user.name || user.email}
          onSignOut={handleSignOut}
        />
      ) : (
        <SignedOutView
          onSignIn={handleSignIn}
          isLoading={isSigningIn}
        />
      )}
    </div>
  );
}

export default App;
