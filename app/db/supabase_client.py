from supabase import create_client, Client
from app.core.config import settings

_supabase_instance: Client | None = None


def _get_supabase() -> Client:
    global _supabase_instance
    if _supabase_instance is None:
        _supabase_instance = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY,
        )
    return _supabase_instance


class _LazySupabase:
    """Proxy that defers Supabase client creation until first use."""

    def __getattr__(self, name: str):
        return getattr(_get_supabase(), name)


supabase: Client = _LazySupabase()  # type: ignore[assignment]
