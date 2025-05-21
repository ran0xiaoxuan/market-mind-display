
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Asset {
  symbol: string;
  name: string;
}

/**
 * Fetches the FMP API key securely from the Supabase edge function
 */
export const getFmpApiKey = async (): Promise<string | null> => {
  try {
    console.log("Fetching FMP API key from Supabase edge function...");
    
    const { data, error } = await supabase.functions.invoke('get-fmp-key', {
      method: 'GET',
    });
    
    if (error) {
      console.error("Error from Edge Function:", error);
      return null;
    }
    
    if (!data?.apiKey) {
      console.error("No API key returned from Edge Function");
      return null;
    }

    console.log("Successfully retrieved FMP API key");
    return data.apiKey;
  } catch (error) {
    console.error("Exception fetching FMP API key:", error);
    return null;
  }
};

/**
 * Searches for stocks based on the query
 */
export const searchStocks = async (query: string, apiKey: string): Promise<Asset[]> => {
  try {
    if (!apiKey) {
      throw new Error("API key is required");
    }
    
    const endpoint = `search?query=${encodeURIComponent(query)}&limit=20&exchange=NASDAQ,NYSE`;
    const url = `https://financialmodelingprep.com/api/v3/${endpoint}&apikey=${apiKey}`;
    
    console.log("Calling FMP API for stocks search...");
    
    const response = await fetch(url, { 
      headers: { 
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors',
      signal: AbortSignal.timeout(10000) // 10 second timeout (reduced from 15)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Console log for debugging
    console.log(`Stock search for "${query}" returned ${data.length} results`);
    
    return data.map((item: any) => ({
      symbol: item.symbol,
      name: item.name || item.symbol
    }));
  } catch (error) {
    console.error("Error searching stocks:", error);
    throw error;
  }
};
