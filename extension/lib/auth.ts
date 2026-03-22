import { getSupabase } from './supabase';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: { id: string; email: string; name: string };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
}

const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Sign in with Google via a real Chrome tab (avoids "browser not secure" error).
 * Opens Google OAuth in a normal tab, captures the ID token from the redirect,
 * and uses supabase.auth.signInWithIdToken for a native Supabase session
 * with real refresh tokens.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2?.client_id;
    if (!clientId) {
      throw new Error('OAuth2 client_id not configured in manifest.');
    }

    // Generate a nonce for ID token verification
    const nonce = crypto.randomUUID();

    const redirectUrl = chrome.identity.getRedirectURL();
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('nonce', nonce);

    const tab = await chrome.tabs.create({ url: authUrl.href });

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
          // Extract ID token from URL fragment
          const url = new URL(changeInfo.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const idToken = params.get('id_token');

          if (!idToken) {
            resolve({ success: false, error: 'No ID token in redirect' });
            return;
          }

          // Use Supabase native signInWithIdToken — creates a real session
          // with access_token + refresh_token managed by the Supabase client
          const { data, error } = await getSupabase().auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
            nonce,
          });

          if (error) {
            resolve({ success: false, error: error.message });
            return;
          }

          const user = data.user;
          resolve({
            success: true,
            user: {
              id: user.id,
              email: user.email ?? '',
              name: user.user_metadata?.full_name ?? user.email ?? '',
            },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Auth failed';
          resolve({ success: false, error: message });
        }
      };

      chrome.tabs.onUpdated.addListener(listener);

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

/**
 * Sign out via Supabase client and clear cached auth tokens.
 */
export async function signOut(): Promise<AuthResult> {
  try {
    await getSupabase().auth.signOut();
    await chrome.identity.clearAllCachedAuthTokens();
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign out failed';
    return { success: false, error: message };
  }
}

/**
 * Get current auth state from Supabase session.
 * The Supabase client handles token refresh automatically via autoRefreshToken.
 */
export async function getAuthState(): Promise<AuthState> {
  try {
    const { data: { session } } = await getSupabase().auth.getSession();

    if (!session?.user) {
      return { isAuthenticated: false, user: null };
    }

    return {
      isAuthenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email ?? '',
        name: session.user.user_metadata?.full_name ?? session.user.email ?? '',
      },
    };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}

/**
 * Verify the extension can reach the FastAPI backend with a valid JWT.
 * Proves the full auth chain: Google OAuth -> Supabase session -> FastAPI validation.
 */
export async function verifyBackendConnection(): Promise<boolean> {
  try {
    const { data: { session } } = await getSupabase().auth.getSession();
    if (!session?.access_token) return false;

    const response = await fetch(`${BACKEND_URL}/api/health/auth`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    return response.ok;
  } catch {
    return false;
  }
}
