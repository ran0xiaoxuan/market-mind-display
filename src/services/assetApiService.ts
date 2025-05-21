
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { popularStocks, searchLocalAssets } from "@/data/assetData";

export interface Asset {
  symbol: string;
  name: string;
}

// Cache the API key to avoid redundant calls
let cachedApiKey: string | null = null;
let lastApiKeyFetchAttempt = 0;
const API_KEY_FETCH_COOLDOWN = 5000; // 5 seconds between fetch attempts
const API_CACHE_LIFETIME = 15 * 60 * 1000; // 15 minutes
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
  if (now - lastApiKeyFetchAttempt < API_KEY_FETCH_COOLDOWN) {
    console.log(`Recently failed to fetch API key, cooling down (${(now - lastApiKeyFetchAttempt) / 1000}s elapsed)`);
    // Return the cached key even if expired, rather than null
    return cachedApiKey;
  }
  
  lastApiKeyFetchAttempt = now;
  
  try {
    console.log("Fetching FMP API key from edge function...");
    const { data, error } = await supabase.functions.invoke('get-fmp-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (error) {
      console.error("Error from edge function:", error);
      return cachedApiKey || null; // Return cached key if available, otherwise null
    }
    
    if (!data?.apiKey) {
      console.error("No API key returned from edge function");
      return cachedApiKey || null;
    }

    console.log("Successfully retrieved FMP API key");
    cachedApiKey = data.apiKey;
    apiKeyCacheTime = now;
    return data.apiKey;
  } catch (error) {
    console.error("Exception fetching FMP API key:", error);
    return cachedApiKey || null; // Return cached key if available, otherwise null
  }
};

/**
 * Searches for stocks based on the query
 */
export const searchStocks = async (query: string, apiKey?: string | null): Promise<Asset[]> => {
  try {
    // If no query, return popular stocks via API if possible
    if (!query || query.trim() === '') {
      console.log("No query provided, returning popular stocks");
      
      if (apiKey) {
        try {
          // Try to fetch real-time popular stocks data
          const url = `https://financialmodelingprep.com/api/v3/search?query=AA&limit=10&exchange=NASDAQ,NYSE&apikey=${apiKey}`;
          const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
              return data.map((item: any) => ({
                symbol: item.symbol,
                name: item.name || item.symbol
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching popular stocks:", error);
        }
      }
      
      return popularStocks;
    }
    
    // If no API key provided, try to fetch it
    if (!apiKey) {
      apiKey = await getFmpApiKey();
    }
    
    // If we still don't have an API key, use local fallback
    if (!apiKey) {
      console.log("No API key available, using local stock data");
      return searchLocalAssets(query);
    }
    
    const endpoint = `search?query=${encodeURIComponent(query)}&limit=20&exchange=NASDAQ,NYSE`;
    const url = `https://financialmodelingprep.com/api/v3/${endpoint}&apikey=${apiKey}`;
    
    console.log("Calling FMP API for stocks", { query });
    
    try {
      const response = await fetch(url, { 
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors',
        signal: AbortSignal.timeout(8000) // 8 second timeout
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Console log for debugging
      console.log(`Stock search for "${query}" returned ${data.length} results`);
      
      if (!Array.isArray(data)) {
        console.error("API returned non-array response:", data);
        throw new Error("Invalid API response format");
      }
      
      if (data.length === 0) {
        // If no results from API, try local fallback
        return searchLocalAssets(query);
      }
      
      return data.map((item: any) => ({
        symbol: item.symbol,
        name: item.name || item.symbol
      }));
    } catch (fetchError) {
      console.error("Fetch error when calling FMP API:", fetchError);
      
      // If this is likely an API key issue, clear the cached key
      if (fetchError.message?.includes("401") || 
          fetchError.message?.includes("403") || 
          fetchError.message?.includes("apikey")) {
        console.log("Clearing cached API key due to potential auth error");
        cachedApiKey = null;
        apiKeyCacheTime = 0;
      }
      
      // Use local fallback data
      return searchLocalAssets(query);
    }
  } catch (error) {
    console.error("Error searching stocks:", error);
    
    // Use local fallback data on error
    console.log("Using local stock data due to API error");
    return searchLocalAssets(query);
  }
};
