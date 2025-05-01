
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
      return null;
    }

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
  if (!query || query.length < 2) return [];
  
  try {
    const url = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=20&exchange=NASDAQ,NYSE&apikey=${apiKey}`;
    
    const response = await fetch(url, { 
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
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
  if (!query || query.length < 2) return [];
  
  try {
    // First get all available cryptocurrencies
    const url = `https://financialmodelingprep.com/api/v3/symbol/available-cryptocurrencies?apikey=${apiKey}`;
    
    const response = await fetch(url, { 
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Filter results by query
    return data
      .filter((item: any) => 
        item.symbol?.toLowerCase().includes(query.toLowerCase()) || 
        item.name?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 20)
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.name || item.symbol
      }));
  } catch (error) {
    console.error("Error searching cryptocurrencies:", error);
    throw error;
  }
};
