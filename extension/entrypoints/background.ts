import { signInWithGoogle, signOut, getAuthState } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { ExtensionMessage, AuthResponse } from '@/lib/messaging';
import { MessageType } from '@/lib/messaging';

export default defineBackground({
  type: 'module',
  main() {
    // CRITICAL: Register ALL listeners synchronously (Pitfall 4)
    chrome.runtime.onMessage.addListener(
      (message: ExtensionMessage, _sender, sendResponse: (response: AuthResponse) => void) => {
        handleMessage(message).then(sendResponse);
        return true; // Keep channel open for async response
      }
    );

    chrome.runtime.onInstalled.addListener(() => {
      console.log('[bubb] Extension installed');
    });

    // Listen for Supabase auth state changes and broadcast to all contexts
    supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      const payload = {
        isAuthenticated: session !== null,
        user: user
          ? {
              id: user.id,
              email: user.email ?? '',
              name: user.user_metadata?.full_name ?? user.email ?? '',
            }
          : null,
      };

      // Broadcast to all extension contexts (side panel, popup)
      chrome.runtime.sendMessage({
        type: MessageType.AUTH_STATE_CHANGED,
        payload,
      }).catch(() => {
        // Ignore errors when no listeners (e.g., side panel closed)
      });
    });
  },
});

async function handleMessage(message: ExtensionMessage): Promise<AuthResponse> {
  switch (message.type) {
    case MessageType.SIGN_IN: {
      const result = await signInWithGoogle();
      if (result.success) {
        const state = await getAuthState();
        const user = state.user;

        // Verify extension-to-backend auth chain (ROADMAP success criterion #3)
        const backendCheck = await verifyBackendConnection();
        if (backendCheck.connected) {
          console.log('[bubb] Full auth chain verified: Extension -> Supabase JWT -> FastAPI');
        } else {
          console.warn('[bubb] Backend connection not verified:', backendCheck.error);
          // Non-blocking: sign-in still succeeds even if backend is unreachable
          // (backend may not be running during local dev)
        }

        return {
          success: true,
          isAuthenticated: true,
          user: user
            ? {
                id: user.id,
                email: user.email ?? '',
                name: user.user_metadata?.full_name ?? user.email ?? '',
              }
            : null,
        };
      }
      return { success: false, error: result.error };
    }

    case MessageType.SIGN_OUT: {
      const result = await signOut();
      return {
        success: result.success,
        error: result.error,
        isAuthenticated: false,
        user: null,
      };
    }

    case MessageType.GET_AUTH_STATE: {
      const state = await getAuthState();
      const user = state.user;
      return {
        success: true,
        isAuthenticated: state.isAuthenticated,
        user: user
          ? {
              id: user.id,
              email: user.email ?? '',
              name: user.user_metadata?.full_name ?? user.email ?? '',
            }
          : null,
      };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Verify extension can authenticate with the FastAPI backend.
 * Called after successful sign-in to prove the full auth chain works:
 * Google OAuth -> Supabase JWT -> FastAPI validation -> authenticated response.
 *
 * This addresses ROADMAP Phase 1 success criterion #3.
 */
async function verifyBackendConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { connected: false, error: 'No active session' };
    }

    const backendUrl = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${backendUrl}/api/health/auth`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[bubb] Backend connection verified:', data);
      return { connected: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        connected: false,
        error: `Backend returned ${response.status}: ${errorData.detail || 'Unknown error'}`,
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    console.warn('[bubb] Backend connection check failed:', message);
    return { connected: false, error: message };
  }
}
