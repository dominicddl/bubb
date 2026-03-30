from supabase import create_client, Client
from app.config import settings


def get_supabase_admin() -> Client:
    """Server-side Supabase client with service role key.
    Bypasses RLS for admin operations (health check, user creation)."""
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )


def get_supabase(token: str) -> Client:
    """User-scoped Supabase client. Uses anon key + user JWT so RLS enforces ownership."""
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(token)
    return client
