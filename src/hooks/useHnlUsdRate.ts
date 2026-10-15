import { useEffect, useState } from "react";

const FALLBACK_RATE = 24.75;
const CACHE_KEY = "hnl_usd_rate_v1";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h

interface CachedRate {
  rate: number;
  ts: number;
}

/**
 * Fetches today's USD→HNL rate (1 USD = X HNL).
 * Falls back to 24.75 if the network/API fails. Cached in sessionStorage.
 */
export function useHnlUsdRate() {
  const [rate, setRate] = useState<number>(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedRate = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL_MS && parsed.rate > 0) {
          return parsed.rate;
        }
      }
    } catch {}
    return FALLBACK_RATE;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed: CachedRate = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL_MS && parsed.rate > 0) return;
      } catch {}
    }
    let cancelled = false;
    setLoading(true);
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((data) => {
        const hnl = data?.rates?.HNL;
        if (!cancelled && typeof hnl === "number" && hnl > 0) {
          setRate(hnl);
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ rate: hnl, ts: Date.now() }));
        }
      })
      .catch(() => {
        // keep fallback
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { rate, loading };
}
