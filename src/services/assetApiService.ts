import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Asset {
  symbol: string;
  name: string;
}

// Cache the API key to avoid redundant calls
let cachedApiKey: string | null = null;
let lastApiKeyFetchAttempt = 0;
const API_KEY_FETCH_COOLDOWN = 1000; // 1 second between fetch attempts
const API_CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes
let apiKeyCacheTime = 0;

/**
 * Fetches the FMP API key securely from the Supabase edge function
 */
export const getFmpApiKey = async (): Promise<string | null> => {
  const now = Date.now();
  
  // Return cached key if available and not expired
  if (cachedApiKey && now - apiKeyCacheTime < API_CACHE_LIFETIME) {
    console.log("Using cached FMP API key");
    return cachedApiKey;
  }

  // Clear expired cache
  if (cachedApiKey && now - apiKeyCacheTime >= API_CACHE_LIFETIME) {
    console.log("API key cache expired, fetching fresh key");
    cachedApiKey = null;
  }

  // Check if we recently tried to fetch and failed
  if (!cachedApiKey && now - lastApiKeyFetchAttempt < API_KEY_FETCH_COOLDOWN) {
    console.log(`Recently failed to fetch API key, cooling down (${(now - lastApiKeyFetchAttempt) / 1000}s elapsed)`);
    return null;
  }
  
  lastApiKeyFetchAttempt = now;
  
  try {
    console.log("Fetching FMP API key from edge function...");
    const { data, error } = await supabase.functions.invoke('get-fmp-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      }
    });
    
    if (error) {
      console.error("Error from edge function:", error);
      return null;
    }
    
    if (!data?.apiKey) {
      console.error("No API key returned from edge function:", data);
      return null;
    }

    console.log("Successfully retrieved FMP API key");
    cachedApiKey = data.apiKey;
    apiKeyCacheTime = now;
    return data.apiKey;
  } catch (error) {
    console.error("Exception fetching FMP API key:", error);
    return null;
  }
};

/**
 * Validates a FMP API key by making a test API call
 */
export const validateFmpApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const testEndpoint = `https://financialmodelingprep.com/api/v3/stock/list?apikey=${apiKey}`;
    const response = await fetch(testEndpoint, {
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      console.error(`API validation failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error("Error validating FMP API key:", error);
    return false;
  }
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
      console.log("No API key available");
      throw new Error("Unable to access market data: API key not available");
    }
    
    // If no query, return empty array (no more default popular stocks)
    if (!query.trim()) {
      return [];
    }
    
    // Define the search endpoint
    const endpoint = `search?query=${encodeURIComponent(query)}&limit=20&exchange=NASDAQ,NYSE`;
    const url = `https://financialmodelingprep.com/api/v3/${endpoint}&apikey=${apiKey}`;
    
    console.log(`Calling FMP API for search: ${query}`);
    
    const response = await fetch(url, { 
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      signal: AbortSignal.timeout(8000) // 8 second timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`API error (${response.status}): ${errorText}`);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error("API returned non-array response:", data);
      throw new Error("Invalid API response format");
    }
    
    console.log(`FMP API returned ${data.length} results`);
    
    // If no results, return empty array
    if (data.length === 0) {
      return [];
    }
    
    // Map the results
    return data.map((item: any) => ({
      symbol: item.symbol,
      name: item.name || item.symbol
    }));
  } catch (error) {
    console.error("Error searching stocks:", error);
    
    // If this is likely an API key issue, clear the cached key
    if (error.message?.includes("401") || 
        error.message?.includes("403") || 
        error.message?.includes("apikey")) {
      console.log("Clearing cached API key due to potential auth error");
      cachedApiKey = null;
      apiKeyCacheTime = 0;
    }
    
    // Re-throw the error to be handled by the calling component
    throw error;
  }
};
