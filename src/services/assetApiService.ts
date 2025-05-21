
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
    console.log("Attempting to fetch FMP API key from edge function...");
    const { data, error } = await supabase.functions.invoke('get-fmp-key', {
      method: 'GET',
    });
    
    if (error || !data?.apiKey) {
      console.error("Error fetching FMP API key:", error || "No API key returned");
      toast({
        title: "API Key Error",
        description: "Failed to retrieve API key. Please try again.",
        variant: "destructive"
      });
      return null;
    }

    console.log("Successfully retrieved FMP API key");
    return data.apiKey;
  } catch (error) {
    console.error("Exception fetching FMP API key:", error);
    toast({
      title: "API Key Error",
      description: "Failed to retrieve API key. Please try again.",
      variant: "destructive"
    });
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
    
    console.log("Calling FMP API for stocks with URL:", url.replace(apiKey, "API_KEY_HIDDEN"));
    
    const response = await fetch(url, { 
      headers: { 
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors',
      signal: AbortSignal.timeout(15000) // 15 second timeout
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
