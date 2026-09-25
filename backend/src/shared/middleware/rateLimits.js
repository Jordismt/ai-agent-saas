import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { ipKeyGenerator } from "express-rate-limit";
import { randomUUID } from "node:crypto";

// Fail closed: never silently disable protection when configuration is missing.
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN");
}
const redis = Redis.fromEnv();
const ip = (req) => ipKeyGenerator(req.ip || req.socket?.remoteAddress || "unknown");
const reject = (res, message = "Demasiadas solicitudes. Inténtalo de nuevo más tarde.") =>
  res.status(429).json({ error: message });

function limiter(prefix, limit, window, key) {
  const instance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `resbix:${prefix}`,
    analytics: false,
  });
  return async (req, res, next) => {
    try {
      const result = await instance.limit(String(key(req)));
      res.setHeader("RateLimit-Limit", String(result.limit));
      res.setHeader("RateLimit-Remaining", String(result.remaining));
      res.setHeader("RateLimit-Reset", String(Math.ceil(result.reset / 1000)));
      if (!result.success) {
        res.setHeader("Retry-After", String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))));
        return reject(res);
      }
      next();
    } catch (error) {
      console.error(`Rate limit ${prefix} unavailable:`, error);
      res.status(503).json({ error: "Servicio temporalmente no disponible. Inténtalo más tarde." });
    }
  };
}

export const apiLimiter = limiter("api", 120, "1 m", ip);
export const publicConversationLimiter = limiter("new-conversation", 12, "1 m", (req) => `${ip(req)}:${req.params.businessId}`);
// Include IP + conversation so creating a new conversation does not reset the IP's AI allowance.
export const publicAiMinuteLimiter = limiter("ai-minute", 10, "1 m", ip);
export const publicAiHourLimiter = limiter("ai-hour", 60, "1 h", ip);
export const bookingLimiter = limiter("bookings", 5, "10 m", ip);
export const billingLimiter = limiter("checkout", 5, "1 h", (req) => req.user?.id || ip(req));

// Distributed per-conversation lock: SET NX PX is atomic across Vercel instances.
// TTL avoids permanent locks after crashes. Release only our own token.
export async function publicAiConcurrency(req, res, next) {
  const key = `resbix:ai-lock:${req.params.conversationId}`;
  const token = randomUUID();
  try {
    const acquired = await redis.set(key, token, { nx: true, px: 90_000 });
    if (acquired !== "OK") return reject(res, "Espera a que termine la respuesta anterior.");
  } catch (error) {
    console.error("AI lock unavailable:", error);
    return res.status(503).json({ error: "Servicio temporalmente no disponible." });
  }
  let released = false;
  const release = async () => {
    if (released) return;
    released = true;
    try {
      await redis.eval(
        'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
        [key], [token]
      );
    } catch (error) { console.error("AI lock release failed:", error); }
  };
  res.once("finish", () => { void release(); });
  res.once("close", () => { void release(); });
  next();
}
