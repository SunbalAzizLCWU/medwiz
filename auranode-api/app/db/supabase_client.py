from supabase import Client, create_client

from app.core.config import settings

_supabase: Client | None = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _supabase


# Backwards-compatible alias resolved lazily
class _LazySupabase:
    def __getattr__(self, name: str) -> object:
        return getattr(get_supabase(), name)


supabase = _LazySupabase()
