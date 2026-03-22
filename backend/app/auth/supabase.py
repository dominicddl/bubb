from supabase import create_client, Client
from app.config import settings


def get_supabase_admin() -> Client:
    """Server-side Supabase client with service role key.
    Bypasses RLS for admin operations."""
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
