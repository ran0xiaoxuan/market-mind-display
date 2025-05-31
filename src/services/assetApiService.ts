
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
 * Validates a FMP API key by making a test API call with retry logic
 */
export const validateFmpApiKey = async (apiKey: string): Promise<boolean> => {
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 10000; // 10 seconds
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Validating FMP API key (attempt ${attempt}/${MAX_RETRIES})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      // Use a simpler endpoint for validation
      const testEndpoint = `https://financialmodelingprep.com/api/v3/stock/list?apikey=${apiKey}&limit=1`;
      
      const response = await fetch(testEndpoint, {
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`API validation failed: ${response.status} ${response.statusText}`);
        if (attempt === MAX_RETRIES) return false;
        continue;
      }
      
      const data = await response.json();
      const isValid = Array.isArray(data) && data.length >= 0; // Accept empty arrays too
      
      if (isValid) {
        console.log("FMP API key validation successful");
        return true;
      }
      
      if (attempt === MAX_RETRIES) {
        console.error("API returned invalid data format");
        return false;
      }
      
    } catch (error) {
      console.error(`API validation attempt ${attempt} failed:`, error);
      
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
      console.log("No API key available for search");
      throw new Error("Unable to access market data: API key not available");
    }
    
    // If no query, return empty array
    if (!query.trim()) {
      return [];
    }
    
    // Define the search endpoint with better parameters
    const endpoint = `search?query=${encodeURIComponent(query)}&limit=20&exchange=NASDAQ,NYSE`;
    const url = `https://financialmodelingprep.com/api/v3/${endpoint}&apikey=${apiKey}`;
    
    console.log(`Searching FMP API for: ${query}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout
    
    const response = await fetch(url, { 
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Search API error (${response.status}): ${errorText}`);
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error("Search API returned non-array response:", data);
      throw new Error("Invalid search response format");
    }
    
    console.log(`FMP search returned ${data.length} results for "${query}"`);
    
    // If no results, return empty array
    if (data.length === 0) {
      return [];
    }
    
    // Map and filter the results
    return data
      .filter((item: any) => item.symbol && item.name) // Filter out invalid entries
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.name || item.symbol
      }))
      .slice(0, 20); // Limit to 20 results
      
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
