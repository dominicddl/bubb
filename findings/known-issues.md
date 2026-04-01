# Known Issues

## ISSUE-1: Rate limiter bypassable via concurrent requests

**Severity**: LOW (pre-beta), HIGH (post-launch)
**Status**: Documented — fix deferred until real user traffic justifies infra cost
**Found**: 2026-04-01 (stress test)

### Problem

SlowAPI's in-memory storage backend is not atomic for concurrent requests. When multiple requests arrive simultaneously from the same IP, they all read the counter before any increment it (TOCTOU race condition). This allows unauthenticated users to exceed the 5/minute AI request limit.

Sequential rate limiting works correctly — this only affects truly simultaneous requests.

### Real-world risk

Low for now. Requires deliberate parallel requests. Normal browser usage (one highlight at a time) always hits the sequential path.

### Fix when ready

Switch SlowAPI to a Redis backend (Upstash free tier: 10,000 commands/day):

```python
# rate_limit.py
from slowapi import Limiter
from limits.storage import RedisStorage

storage = RedisStorage(uri=os.getenv("REDIS_URL"))
limiter = Limiter(key_func=_get_user_id_or_ip, storage_uri=os.getenv("REDIS_URL"))
```

Requires:
1. Sign up for Upstash (free) and create a Redis database
2. Add `REDIS_URL` env var to Render
3. Add `redis` to requirements.txt
4. Update `limiter` initialization in `rate_limit.py`

### Trigger to fix

Implement this before: public launch, Chrome Web Store listed listing, or any growth beyond trusted beta testers.
