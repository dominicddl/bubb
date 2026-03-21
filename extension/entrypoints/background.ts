import { signInWithGoogle, signOut, getAuthState } from '@/lib/auth';
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

async function handleMessage(message: ExtensionMessage): Promise<AuthResponse> {
  switch (message.type) {
    case MessageType.SIGN_IN: {
      const result = await signInWithGoogle();
      if (result.success && result.user) {
        return {
          success: true,
          isAuthenticated: true,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
          },
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
      const user = state.user as Record<string, any> | null;
      return {
        success: true,
        isAuthenticated: state.isAuthenticated,
        user: user
          ? {
              id: user.id ?? '',
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