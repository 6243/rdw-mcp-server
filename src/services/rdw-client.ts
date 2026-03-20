/**
 * RDW API Client — handles all HTTP requests to opendata.rdw.nl
 * Includes caching, rate limiting, and error handling.
 */

import axios, { AxiosError } from "axios";
import { RDW_BASE_URL, REQUEST_TIMEOUT, MAX_CONCURRENT_REQUESTS, CACHE_TTL } from "../constants.js";
import type { CacheEntry } from "../types.js";

// ---------- In-memory cache ----------
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });

  // Evict old entries if cache gets too large (>5000)
  if (cache.size > 5000) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
}

// ---------- Concurrency limiter ----------
let activeRequests = 0;
const queue: Array<{ resolve: () => void }> = [];

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return;
  }
  return new Promise<void>((resolve) => {
    queue.push({ resolve });
    // Timeout after 30 seconds in queue
    setTimeout(() => {
      const idx = queue.findIndex((q) => q.resolve === resolve);
      if (idx !== -1) {
        queue.splice(idx, 1);
        resolve(); // let it proceed anyway to avoid hanging
      }
    }, 30000);
  });
}

function releaseSlot(): void {
  activeRequests--;
  const next = queue.shift();
  if (next) {
    activeRequests++;
    next.resolve();
  }
}

// ---------- SoQL Helpers ----------

/**
 * Escape a string for use inside SoQL single-quoted literals.
 * Prevents query breakage from names containing apostrophes (e.g. O'Brien).
 */
export function soqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

// ---------- Public API ----------

export interface SodaQueryParams {
  /** Direct field=value filters (e.g. { kenteken: "AB123C" }) */
  filters?: Record<string, string>;
  /** Raw $where clause */
  where?: string;
  /** $select clause */
  select?: string;
  /** $order clause */
  order?: string;
  /** $limit — defaults to 50 */
  limit?: number;
  /** $offset for pagination */
  offset?: number;
  /** $q — full-text search */
  q?: string;
}

/**
 * Query a RDW Socrata/SODA dataset.
 * @param datasetId - The Socrata resource ID (e.g. "m9d7-ebf2")
 * @param params - Optional query parameters
 * @returns Array of records
 */
export async function queryRdw<T = Record<string, unknown>>(
  datasetId: string,
  params: SodaQueryParams = {}
): Promise<T[]> {
  // Build URL and query string
  const url = `${RDW_BASE_URL}/${datasetId}.json`;
  const queryParams: Record<string, string> = {};

  // Direct field filters
  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      queryParams[key] = value;
    }
  }

  if (params.where) queryParams["$where"] = params.where;
  if (params.select) queryParams["$select"] = params.select;
  if (params.order) queryParams["$order"] = params.order;
  if (params.q) queryParams["$q"] = params.q;
  queryParams["$limit"] = String(params.limit ?? 50);
  if (params.offset) queryParams["$offset"] = String(params.offset);

  // Check cache
  const cacheKey = `${datasetId}:${JSON.stringify(queryParams)}`;
  const cached = getCached<T[]>(cacheKey);
  if (cached) return cached;

  // Acquire concurrency slot
  await acquireSlot();

  try {
    const response = await axios.get<T[]>(url, {
      params: queryParams,
      timeout: REQUEST_TIMEOUT,
      headers: {
        Accept: "application/json",
      },
    });

    const data = response.data;
    setCache(cacheKey, data);
    return data;
  } finally {
    releaseSlot();
  }
}

/**
 * Handle API errors and return a user-friendly error message.
 */
export function handleRdwError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 400:
          return "Ongeldige zoekopdracht. Controleer de parameters en probeer opnieuw. (Bad request — check your query parameters.)";
        case 403:
          return "Toegang geweigerd door de RDW API. (Access denied by the RDW API.)";
        case 404:
          return "Dataset niet gevonden. Controleer of de dataset-ID correct is. (Dataset not found.)";
        case 429:
          return "Te veel verzoeken aan de RDW API. Probeer het over een minuut opnieuw. (Rate limit exceeded — wait and retry.)";
        case 500:
        case 502:
        case 503:
          return "De RDW API is momenteel niet beschikbaar. Probeer het over een paar minuten opnieuw. (RDW API is temporarily unavailable.)";
        default:
          return `RDW API fout (status ${status}). Probeer het later opnieuw. (API error status ${status}.)`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "Het verzoek aan de RDW API duurde te lang (timeout). Probeer het opnieuw. (Request timed out.)";
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return "Kan geen verbinding maken met de RDW API. Controleer uw internetverbinding. (Cannot connect to RDW API.)";
    }
  }
  return `Onverwachte fout: ${error instanceof Error ? error.message : String(error)}`;
}
