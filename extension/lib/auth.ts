import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
}

/**
 * Sign in with Google via chrome.identity.launchWebAuthFlow (D-01).
 * Uses ID token flow (response_type=id_token), NOT PKCE.
 * Google gets the hashed nonce, Supabase gets the raw nonce.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    // 1. Generate cryptographic nonce
    const nonce = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
    );

    // 2. Hash nonce for Google (Supabase receives raw nonce to verify)
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonce);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // 3. Build Google OAuth URL
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2?.client_id;
    if (!clientId || clientId === 'PLACEHOLDER.apps.googleusercontent.com') {
      throw new Error(
        'OAuth2 client_id not configured in manifest. ' +
          'Update wxt.config.ts with your Google Cloud Console client ID.'
      );
    }

    const redirectUrl = chrome.identity.getRedirectURL();
    const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('nonce', hashedNonce);
    authUrl.searchParams.set('prompt', 'consent');

    // 4. Launch native Google account picker (D-01)
    const responseUrl = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl.href, interactive: true },
        (redirectedTo) => {
          if (chrome.runtime.lastError || !redirectedTo) {
            reject(
              new Error(
                chrome.runtime.lastError?.message || 'Auth flow cancelled or failed'
              )
            );
          } else {
            resolve(redirectedTo);
          }
        }
      );
    });

    // 5. Extract ID token from redirect URL hash fragment
    const url = new URL(responseUrl);
    const params = new URLSearchParams(url.hash.substring(1));
    const idToken = params.get('id_token');
    if (!idToken) {
      throw new Error('No id_token in Google response');
    }

    // 6. Exchange ID token with Supabase (raw nonce, not hashed)
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      nonce: nonce,
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown auth error';
    console.error('[bubb] signInWithGoogle failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Sign out and clear session from chrome.storage.local.
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign out failed';
    return { success: false, error: message };
  }
}

/**
 * Get current auth state. Reads session from chrome.storage.local
 * via the Supabase client's custom adapter (AUTH-02).
 */
export async function getAuthState(): Promise<AuthState> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    isAuthenticated: session !== null,
    user: session?.user ?? null,
    session,
  };
}
