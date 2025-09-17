import { logger } from "./logger.js";

export type RetryOptions = {
  retries?: number; // max retry attempts (not counting the initial try)
  backoffMs?: number; // base backoff in ms, will use exponential backoff
  parseAs?: "json" | "text";
  isIncomplete?: (data: any) => boolean; // return true if data is incomplete and should be retried (until retries exhausted)
};

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  opts: RetryOptions = {}
): Promise<any> {
  const {
    retries = 3,
    backoffMs = 500,
    parseAs = "json",
    isIncomplete,
  } = opts;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      if (attempt > 0) {
        const delay = backoffMs * Math.pow(2, attempt - 1);
        logger.debug(`Retry attempt ${attempt} after ${delay}ms`, url);
        await sleep(delay);
      }

      const res = await fetch(url, init);
      const retryableStatus = res.status === 429 || res.status >= 500;
      if (!res.ok) {
        if (retryableStatus && attempt < retries) {
          attempt++;
          continue;
        }
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = parseAs === "json" ? await res.json() : await res.text();

      if (isIncomplete && isIncomplete(data)) {
        logger.warn("Fetched data appears incomplete; will", attempt < retries ? "retry" : "not retry further", { url });
        if (attempt < retries) {
          attempt++;
          continue;
        }
      }

      return data;
    } catch (err) {
      lastError = err;
      const isNetwork = err instanceof TypeError || (err as any)?.name === "FetchError";
      if (isNetwork && attempt < retries) {
        logger.warn(`Network error on attempt ${attempt}: ${(err as Error).message}`);
        attempt++;
        continue;
      }
      break; // non-retryable or out of retries
    }
  }

  logger.error("fetchWithRetry failed after retries", { url, error: lastError });
  throw lastError instanceof Error ? lastError : new Error("Unknown fetch error");
}
