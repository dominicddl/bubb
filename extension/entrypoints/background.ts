import { signInWithGoogle, signOut, getAuthState, verifyBackendConnection } from '@/lib/auth';
import type { ExtensionMessage, AuthResponse, ExplainTextMessage } from '@/lib/messaging';
import { MessageType } from '@/lib/messaging';
import { getSupabase } from '@/lib/supabase';

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
  },
});

/**
 * Broadcast auth state change to all open extension contexts (sidepanel, popup).
 * This ensures UI stays in sync when auth changes happen in the background.
 */
function broadcastAuthStateChanged(
  isAuthenticated: boolean,
  user: { id: string; email: string; name: string } | null,
) {
  chrome.runtime.sendMessage({
    type: MessageType.AUTH_STATE_CHANGED,
    payload: { isAuthenticated, user },
  }).catch(() => {
    // Ignore errors when no listeners are active (e.g., sidepanel is closed)
  });
}

async function handleMessage(message: ExtensionMessage): Promise<AuthResponse> {
  switch (message.type) {
    case MessageType.SIGN_IN: {
      const result = await signInWithGoogle();
      if (result.success && result.user) {
        const user = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        };

        // Broadcast to all open UI contexts
        broadcastAuthStateChanged(true, user);

        // Verify backend connectivity after successful sign-in
        const backendOk = await verifyBackendConnection();
        if (!backendOk) {
          console.warn('[bubb] Backend connection verification failed — backend may be offline');
        }

        return {
          success: true,
          isAuthenticated: true,
          user,
        };
      }
      return { success: false, error: result.error };
    }

    case MessageType.SIGN_OUT: {
      const result = await signOut();

      // Broadcast signed-out state to all open UI contexts
      broadcastAuthStateChanged(false, null);

      return {
        success: result.success,
        error: result.error,
        isAuthenticated: false,
        user: null,
      };
    }

    case MessageType.GET_AUTH_STATE: {
      const state = await getAuthState();
      return {
        success: true,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      };
    }

    case MessageType.EXPLAIN_TEXT: {
      const { text, context, sourceUrl, pageTitle } = (message as ExplainTextMessage).payload;
      const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const resp = await fetch(`${BACKEND_URL}/api/explain`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text,
            context,
            source_url: sourceUrl,
            page_title: pageTitle,
          }),
        });

        if (!resp.ok) {
          return { success: false, error: `API error: ${resp.status}` } as AuthResponse;
        }

        const data = await resp.json();
        return { success: true, explanation: data.explanation } as unknown as AuthResponse;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: msg };
      }
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}
