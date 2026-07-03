import "server-only";

/**
 * Sliding-window rate limiter behind a swappable adapter.
 *
 * The default adapter is per-instance in-memory, which is correct for a single
 * Node process and best-effort across serverless instances. To move to
 * self-hosted Redis later (per the deferred-infrastructure decision), implement
 * RateLimitAdapter against Redis and swap it in setRateLimitAdapter() — no
 * call sites change. Durable account lockout lives in the user store, not here.
 */
export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

export type RateLimitAdapter = {
  hit(key: string, limit: number, windowMs: number): RateLimitResult;
};

const memoryBuckets = new Map<string, number[]>();

const memoryAdapter: RateLimitAdapter = {
  hit(key, limit, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (memoryBuckets.get(key) ?? []).filter((ts) => ts > windowStart);
    if (timestamps.length >= limit) {
      memoryBuckets.set(key, timestamps);
      const retryAfterSeconds = Math.ceil((timestamps[0] + windowMs - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(retryAfterSeconds, 1) };
    }
    timestamps.push(now);
    memoryBuckets.set(key, timestamps);
    if (memoryBuckets.size > 10_000) {
      for (const [bucketKey, bucketTimestamps] of memoryBuckets) {
        if (!bucketTimestamps.some((ts) => ts > windowStart)) memoryBuckets.delete(bucketKey);
      }
    }
    return { allowed: true, remaining: limit - timestamps.length, retryAfterSeconds: 0 };
  }
};

let activeAdapter: RateLimitAdapter = memoryAdapter;

export function setRateLimitAdapter(adapter: RateLimitAdapter) {
  activeAdapter = adapter;
}

export function rateLimit(scope: string, identifier: string, limit: number, windowMs: number): RateLimitResult {
  return activeAdapter.hit(`${scope}:${identifier}`, limit, windowMs);
}

export function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

/** Login attempts per IP: 10 per 5 minutes. */
export function loginRateLimit(request: Request) {
  return rateLimit("login-ip", requestIp(request), 10, 5 * 60 * 1000);
}

/** MFA/verification attempts per session: 8 per 5 minutes. */
export function mfaRateLimit(sessionId: string) {
  return rateLimit("mfa", sessionId, 8, 5 * 60 * 1000);
}

/** Sensitive account mutations (password change, elevation) per session: 10 per 10 minutes. */
export function accountMutationRateLimit(sessionId: string) {
  return rateLimit("account", sessionId, 10, 10 * 60 * 1000);
}
