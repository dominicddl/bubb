import type { Session, User } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: { id: string; email: string; name: string };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
}

const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Sign in with Google via a real Chrome tab (avoids "browser not secure" error).
 * Opens Google OAuth in a normal tab, captures the redirect, and exchanges
 * the access token with our backend for a Supabase session.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    // 1. Build Google OAuth URL
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2?.client_id;
    if (!clientId) {
      throw new Error('OAuth2 client_id not configured in manifest.');
    }

    const redirectUrl = chrome.identity.getRedirectURL();
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('scope', 'openid email profile');

    // 2. Open in a real Chrome tab (not embedded browser)
    const tab = await chrome.tabs.create({ url: authUrl.href });

    // 3. Listen for redirect back to our extension's redirect URL
    return new Promise<AuthResult>((resolve) => {
      const listener = async (
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
      ) => {
        if (tabId !== tab.id || !changeInfo.url?.startsWith(redirectUrl)) {
          return;
        }

        chrome.tabs.onUpdated.removeListener(listener);
        chrome.tabs.onRemoved.removeListener(closeListener);
        chrome.tabs.remove(tabId);

        try {
          // 4. Extract access token from URL fragment
          const url = new URL(changeInfo.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const googleToken = params.get('access_token');

          if (!googleToken) {
            resolve({ success: false, error: 'No access token in redirect' });
            return;
          }

          // 5. Exchange Google token for Supabase session via backend
          const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: googleToken }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Backend auth failed' }));
            resolve({ success: false, error: error.detail || 'Backend auth failed' });
            return;
          }

          const data = await response.json();

          // 6. Store session manually in chrome.storage
          //    We generate our own JWT so there's no refresh token.
          //    Store the session in the format Supabase client expects.
          const supabaseUrl = import.meta.env.WXT_SUPABASE_URL;
          const storageKey = `sb-${new URL(supabaseUrl).hostname}-auth-token`;
          const session = {
            access_token: data.access_token,
            refresh_token: '',
            token_type: 'bearer',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user: {
              id: data.user.id,
              email: data.user.email,
              user_metadata: { full_name: data.user.name },
              aud: 'authenticated',
              role: 'authenticated',
            },
          };
          await chrome.storage.local.set({ [storageKey]: JSON.stringify(session) });
          resolve({ success: true, user: data.user });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Auth failed';
          resolve({ success: false, error: message });
        }
      };

      chrome.tabs.onUpdated.addListener(listener);

      // Clean up if tab is closed before auth completes
      const closeListener = (closedTabId: number) => {
        if (closedTabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.onRemoved.removeListener(closeListener);
          resolve({ success: false, error: 'Sign-in cancelled' });
        }
      };
      chrome.tabs.onRemoved.addListener(closeListener);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown auth error';
    console.error('[bubb] signInWithGoogle failed:', message);
    return { success: false, error: message };
  }
}

function getStorageKey(): string {
  const supabaseUrl = import.meta.env.WXT_SUPABASE_URL;
  return `sb-${new URL(supabaseUrl).hostname}-auth-token`;
}

/**
 * Sign out and clear session from chrome.storage.local.
 */
export async function signOut(): Promise<AuthResult> {
  try {
    await chrome.identity.clearAllCachedAuthTokens();
    await chrome.storage.local.remove(getStorageKey());
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign out failed';
    return { success: false, error: message };
  }
}

/**
 * Get current auth state from chrome.storage.local.
 */
export async function getAuthState(): Promise<AuthState> {
  try {
    const key = getStorageKey();
    const result = await chrome.storage.local.get(key);
    const raw = result[key];
    if (!raw) return { isAuthenticated: false, user: null, session: null };

    const session = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!session?.access_token || !session?.user) {
      return { isAuthenticated: false, user: null, session: null };
    }

    // Check if token is expired
    if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      await chrome.storage.local.remove(key);
      return { isAuthenticated: false, user: null, session: null };
    }

    return {
      isAuthenticated: true,
      user: session.user,
      session,
    };
  } catch {
    return { isAuthenticated: false, user: null, session: null };
  }
}
