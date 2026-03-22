import { signInWithGoogle, signOut, getAuthState, verifyBackendConnection } from '@/lib/auth';
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

    default:
      return { success: false, error: 'Unknown message type' };
  }
}
