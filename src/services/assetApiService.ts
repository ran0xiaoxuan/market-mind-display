
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
 * Creates a proxy URL for FMP API requests to bypass CORS issues
 */
const createProxyUrl = (endpoint: string, apiKey: string): string => {
  // Encode the entire original URL to pass as a parameter
  const originalUrl = encodeURIComponent(
    `https://financialmodelingprep.com/api/v3/${endpoint}&apikey=${apiKey}`
  );
  
  // Use the cors-anywhere service
  return `https://cors-anywhere.herokuapp.com/https://financialmodelingprep.com/api/v3/${endpoint}&apikey=${apiKey}`;
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

/**
 * Searches for cryptocurrencies based on the query
 */
export const searchCryptocurrencies = async (query: string, apiKey: string): Promise<Asset[]> => {
  try {
    if (!apiKey) {
      throw new Error("API key is required");
    }
    
    // First get all available cryptocurrencies
    const endpoint = `symbol/available-cryptocurrencies`;
    const url = `https://financialmodelingprep.com/api/v3/${endpoint}?apikey=${apiKey}`;
    
    console.log("Calling FMP API for cryptos with URL:", url.replace(apiKey, "API_KEY_HIDDEN"));
    
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
    
    // Filter results by query - case insensitive matching on any part of symbol or name
    const results = data
      .filter((item: any) => 
        item.symbol?.toLowerCase().includes(query.toLowerCase()) || 
        item.name?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 20)
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.name || item.symbol
      }));
      
    // Console log for debugging  
    console.log(`Crypto search for "${query}" returned ${results.length} results`);
    
    return results;
  } catch (error) {
    console.error("Error searching cryptocurrencies:", error);
    throw error;
  }
};
