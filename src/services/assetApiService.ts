
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Asset {
  symbol: string;
  name: string;
}

// Cache the API key to avoid redundant calls
let cachedApiKey: string | null = null;
let lastApiKeyFetchAttempt = 0;
const API_KEY_FETCH_COOLDOWN = 2000; // 2 seconds between fetch attempts
const API_CACHE_LIFETIME = 10 * 60 * 1000; // 10 minutes
let apiKeyCacheTime = 0;

/**
 * Fetches the FMP API key securely from the Supabase edge function
 */
export const getFmpApiKey = async (): Promise<string | null> => {
  const now = Date.now();
  
  // Return cached key if available and not expired
  if (cachedApiKey && now - apiKeyCacheTime < API_CACHE_LIFETIME) {
    console.log("[AssetAPI] Using cached FMP API key");
    return cachedApiKey;
  }

  // Clear expired cache
  if (cachedApiKey && now - apiKeyCacheTime >= API_CACHE_LIFETIME) {
    console.log("[AssetAPI] API key cache expired, fetching fresh key");
    cachedApiKey = null;
  }

  // Check if we recently tried to fetch and failed
  if (!cachedApiKey && now - lastApiKeyFetchAttempt < API_KEY_FETCH_COOLDOWN) {
    console.log(`[AssetAPI] Recently failed to fetch API key, cooling down (${(now - lastApiKeyFetchAttempt) / 1000}s elapsed)`);
    return null;
  }
  
  lastApiKeyFetchAttempt = now;
  
  try {
    console.log("[AssetAPI] Fetching FMP API key from edge function...");
    const { data, error } = await supabase.functions.invoke('get-fmp-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      }
    });
    
    if (error) {
      console.error("[AssetAPI] Error from edge function:", error);
      return null;
    }
    
    if (!data?.key) {
      console.error("[AssetAPI] No API key returned from edge function:", data);
      return null;
    }

    console.log("[AssetAPI] Successfully retrieved FMP API key");
    cachedApiKey = data.key;
    apiKeyCacheTime = now;
    return data.key;
  } catch (error) {
    console.error("[AssetAPI] Exception fetching FMP API key:", error);
    return null;
  }
};

/**
 * Validates a FMP API key by making a test API call with retry logic
 */
export const validateFmpApiKey = async (apiKey: string): Promise<boolean> => {
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 10000; // 10 seconds
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[AssetAPI] Validating FMP API key (attempt ${attempt}/${MAX_RETRIES})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      // Use a simpler endpoint for validation
      const testEndpoint = `https://financialmodelingprep.com/api/v3/stock/list?apikey=${apiKey}&limit=1`;
      
      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'TradingApp/1.0'
        },
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`[AssetAPI] API validation failed: ${response.status} ${response.statusText}`);
        if (attempt === MAX_RETRIES) return false;
        continue;
      }
      
      const data = await response.json();
      const isValid = Array.isArray(data) && data.length >= 0; // Accept empty arrays too
      
      if (isValid) {
        console.log("[AssetAPI] FMP API key validation successful");
        return true;
      }
      
      if (attempt === MAX_RETRIES) {
        console.error("[AssetAPI] API returned invalid data format");
        return false;
      }
      
    } catch (error) {
      console.error(`[AssetAPI] API validation attempt ${attempt} failed:`, error);
      
      if (attempt === MAX_RETRIES) {
        return false;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  
  return false;
};

/**
 * Searches for stocks based on the query using live market data
 */
export const searchStocks = async (query: string, apiKey?: string | null): Promise<Asset[]> => {
  try {
    // If no API key provided, try to fetch it
    if (!apiKey) {
      apiKey = await getFmpApiKey();
    }
    
    // If we still don't have an API key, throw an error
    if (!apiKey) {
      console.log("[AssetAPI] No API key available for search");
      throw new Error("Unable to access market data: API key not available");
    }
    
    // If no query, return empty array
    if (!query.trim()) {
      return [];
    }

    // Heuristic: detect if user likely typed a symbol (letters/numbers, no spaces, short)
    const isLikelySymbol = (q: string) => /^[A-Za-z0-9\.\-]{1,7}$/.test(q.trim());

    // Build stable endpoints (symbol + name)
    // Examples: 
    //  - https://financialmodelingprep.com/stable/search-symbol?query=SPY&apikey=...
    //  - https://financialmodelingprep.com/stable/search-name?query=AA&apikey=...
    const base = 'https://financialmodelingprep.com/stable';
    const symbolUrl = `${base}/search-symbol?query=${encodeURIComponent(query)}&apikey=${apiKey}`;
    const nameUrl = `${base}/search-name?query=${encodeURIComponent(query)}&apikey=${apiKey}`;

    console.log(`[AssetAPI] Searching FMP stable endpoints for: ${query}`);

    // Helper to fetch with timeout
    const fetchJson = async (url: string, timeoutMs = 12000): Promise<any[]> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'TradingApp/1.0'
          },
          mode: 'cors',
          signal: controller.signal
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Decide priority
    const firstUrl = isLikelySymbol(query) ? symbolUrl : nameUrl;
    const secondUrl = isLikelySymbol(query) ? nameUrl : symbolUrl;

    // Fetch in parallel but with known priority (both go out at once)
    const [primaryRes, secondaryRes] = await Promise.allSettled([
      fetchJson(firstUrl),
      fetchJson(secondUrl)
    ]);

    const primary = primaryRes.status === 'fulfilled' ? primaryRes.value : [];
    const secondary = secondaryRes.status === 'fulfilled' ? secondaryRes.value : [];

    // Normalize items from both endpoints
    const normalize = (arr: any[]): Asset[] => arr
      .filter((i: any) => i && typeof i.symbol === 'string' && (typeof i.name === 'string' || i.name === undefined))
      .map((i: any) => ({ symbol: i.symbol, name: i.name || i.symbol }));

    const listA = normalize(primary);
    const listB = normalize(secondary);

    // Merge & dedupe by symbol, keep order priority
    const merged: Asset[] = [];
    const seen = new Set<string>();
    for (const item of [...listA, ...listB]) {
      const key = item.symbol.toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    // Cap to 20
    return merged.slice(0, 20);

  } catch (error: any) {
    console.error("[AssetAPI] Error searching stocks:", error);
    
    // If this is likely an API key issue, clear the cached key
    if (error?.message?.includes("401") || 
        error?.message?.includes("403") || 
        error?.message?.toLowerCase?.().includes("apikey")) {
      console.log("[AssetAPI] Clearing cached API key due to potential auth error");
      cachedApiKey = null;
      apiKeyCacheTime = 0;
    }
    
    // Re-throw the error to be handled by the calling component
    throw error;
  }
};
