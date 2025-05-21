
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
const API_KEY_FETCH_COOLDOWN = 10000; // 10 seconds between fetch attempts

/**
 * Fetches the FMP API key securely from the Supabase edge function
 */
export const getFmpApiKey = async (): Promise<string | null> => {
  // Return cached key if available
  if (cachedApiKey) {
    console.log("Using cached FMP API key");
    return cachedApiKey;
  }

  // Check if we recently tried to fetch and failed
  const now = Date.now();
  if (now - lastApiKeyFetchAttempt < API_KEY_FETCH_COOLDOWN) {
    console.log("Recently failed to fetch API key, using cooldown period");
    return null;
  }
  
  lastApiKeyFetchAttempt = now;
  
  try {
    console.log("Attempting to fetch FMP API key from edge function...");
    const { data, error } = await supabase.functions.invoke('get-fmp-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (error) {
      console.error("Error from edge function:", error);
      return null;
    }
    
    if (!data?.apiKey) {
      console.error("No API key returned from edge function");
      return null;
    }

    console.log("Successfully retrieved FMP API key");
    cachedApiKey = data.apiKey;
    return data.apiKey;
  } catch (error) {
    console.error("Exception fetching FMP API key:", error);
    return null;
  }
};

/**
 * Searches for stocks based on the query
 */
export const searchStocks = async (query: string, apiKey?: string | null): Promise<Asset[]> => {
  try {
    // If no query, return popular stocks
    if (!query || query.trim() === '') {
      console.log("No query provided, returning popular stocks");
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
    
    console.log("Calling FMP API for stocks with URL:", url.replace(apiKey, "API_KEY_HIDDEN"));
    
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
        console.error(`API error: ${response.status} ${response.statusText}`);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Console log for debugging
      console.log(`Stock search for "${query}" returned ${data.length} results`);
      
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
      // Clear the cached API key as it might be invalid
      if (cachedApiKey) {
        console.log("Clearing cached API key due to fetch error");
        cachedApiKey = null;
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
