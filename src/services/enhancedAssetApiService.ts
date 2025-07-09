
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface EnhancedAsset {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
  lastUpdated?: string;
  marketCap?: number;
  sector?: string;
}

export interface SearchMetadata {
  searchTime: number;
  resultCount: number;
  apiResponseTime: number;
  dataFreshness: string;
}

// Enhanced cache with better invalidation
const ENHANCED_CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes
const SEARCH_CACHE = new Map<string, { data: EnhancedAsset[]; timestamp: number; metadata: SearchMetadata }>();

let cachedApiKey: string | null = null;
let apiKeyCacheTime = 0;
const API_KEY_CACHE_LIFETIME = 10 * 60 * 1000; // 10 minutes

/**
 * Enhanced API key fetching with better error handling
 */
export const getEnhancedFmpApiKey = async (): Promise<string | null> => {
  const now = Date.now();
  
  if (cachedApiKey && now - apiKeyCacheTime < API_KEY_CACHE_LIFETIME) {
    console.log("[EnhancedAssetAPI] Using cached API key");
    return cachedApiKey;
  }

  try {
    console.log("[EnhancedAssetAPI] Fetching fresh API key...");
    const startTime = performance.now();
    
    const { data, error } = await supabase.functions.invoke('get-fmp-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const responseTime = performance.now() - startTime;
    console.log(`[EnhancedAssetAPI] API key fetch took ${responseTime.toFixed(2)}ms`);
    
    if (error || !data?.key) {
      console.error("[EnhancedAssetAPI] Failed to get API key:", error);
      return null;
    }

    cachedApiKey = data.key;
    apiKeyCacheTime = now;
    return data.key;
  } catch (error) {
    console.error("[EnhancedAssetAPI] Exception fetching API key:", error);
    return null;
  }
};

/**
 * Enhanced asset search with better ranking and validation
 */
export const searchEnhancedAssets = async (
  query: string, 
  apiKey?: string | null
): Promise<{ assets: EnhancedAsset[]; metadata: SearchMetadata }> => {
  const searchStartTime = performance.now();
  
  try {
    // Check cache first
    const cacheKey = `${query.toLowerCase().trim()}`;
    const cached = SEARCH_CACHE.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < ENHANCED_CACHE_LIFETIME) {
      console.log(`[EnhancedAssetAPI] Returning cached results for "${query}"`);
      return { assets: cached.data, metadata: cached.metadata };
    }

    // Get API key if not provided
    if (!apiKey) {
      apiKey = await getEnhancedFmpApiKey();
    }
    
    if (!apiKey) {
      throw new Error("Unable to access market data: API key not available");
    }
    
    if (!query.trim()) {
      return { 
        assets: [], 
        metadata: { 
          searchTime: 0, 
          resultCount: 0, 
          apiResponseTime: 0, 
          dataFreshness: 'N/A' 
        } 
      };
    }

    // Make API request with timing
    const apiStartTime = performance.now();
    const endpoint = `search?query=${encodeURIComponent(query)}&limit=50&exchange=NASDAQ,NYSE,AMEX`;
    const url = `https://financialmodelingprep.com/api/v3/${endpoint}&apikey=${apiKey}`;
    
    console.log(`[EnhancedAssetAPI] Searching for: "${query}"`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, { 
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
    const apiResponseTime = performance.now() - apiStartTime;
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error("[EnhancedAssetAPI] Invalid response format:", data);
      throw new Error("Invalid search response format");
    }

    // Enhanced data processing with validation and ranking
    const processedAssets = data
      .filter((item: any) => {
        // Validate required fields
        return item.symbol && 
               item.name && 
               item.symbol.length <= 10 && // Filter out invalid symbols
               !item.symbol.includes('.') && // Filter out preferred shares
               item.name.length > 0;
      })
      .map((item: any): EnhancedAsset => ({
        symbol: item.symbol.toUpperCase(),
        name: item.name,
        exchange: item.exchangeShortName || item.exchange || 'Unknown',
        type: item.type || 'stock',
        lastUpdated: new Date().toISOString(),
        marketCap: item.marketCap || 0,
        sector: item.sector
      }))
      .sort((a, b) => {
        // Enhanced ranking algorithm
        const queryLower = query.toLowerCase();
        const aSymbolLower = a.symbol.toLowerCase();
        const bSymbolLower = b.symbol.toLowerCase();
        const aNameLower = a.name.toLowerCase();
        const bNameLower = b.name.toLowerCase();
        
        // Exact symbol match gets highest priority
        if (aSymbolLower === queryLower && bSymbolLower !== queryLower) return -1;
        if (bSymbolLower === queryLower && aSymbolLower !== queryLower) return 1;
        
        // Symbol starts with query gets next priority
        if (aSymbolLower.startsWith(queryLower) && !bSymbolLower.startsWith(queryLower)) return -1;
        if (bSymbolLower.startsWith(queryLower) && !aSymbolLower.startsWith(queryLower)) return 1;
        
        // Symbol contains query
        if (aSymbolLower.includes(queryLower) && !bSymbolLower.includes(queryLower)) return -1;
        if (bSymbolLower.includes(queryLower) && !aSymbolLower.includes(queryLower)) return 1;
        
        // Name starts with query
        if (aNameLower.startsWith(queryLower) && !bNameLower.startsWith(queryLower)) return -1;
        if (bNameLower.startsWith(queryLower) && !aNameLower.startsWith(queryLower)) return 1;
        
        // Market cap as tie breaker (larger companies first)
        return (b.marketCap || 0) - (a.marketCap || 0);
      })
      .slice(0, 20);

    const totalSearchTime = performance.now() - searchStartTime;
    const metadata: SearchMetadata = {
      searchTime: totalSearchTime,
      resultCount: processedAssets.length,
      apiResponseTime,
      dataFreshness: new Date().toISOString()
    };

    console.log(`[EnhancedAssetAPI] Search completed: ${processedAssets.length} results in ${totalSearchTime.toFixed(2)}ms`);
    
    // Cache the results
    SEARCH_CACHE.set(cacheKey, {
      data: processedAssets,
      timestamp: Date.now(),
      metadata
    });

    // Limit cache size
    if (SEARCH_CACHE.size > 100) {
      const oldestKey = SEARCH_CACHE.keys().next().value;
      SEARCH_CACHE.delete(oldestKey);
    }

    return { assets: processedAssets, metadata };
    
  } catch (error) {
    const totalSearchTime = performance.now() - searchStartTime;
    console.error("[EnhancedAssetAPI] Search failed:", error);
    
    // Return fallback data with error metadata
    return {
      assets: [],
      metadata: {
        searchTime: totalSearchTime,
        resultCount: 0,
        apiResponseTime: 0,
        dataFreshness: 'Error'
      }
    };
  }
};

/**
 * Validate asset data freshness
 */
export const validateAssetDataFreshness = (asset: EnhancedAsset): boolean => {
  if (!asset.lastUpdated) return false;
  
  const lastUpdate = new Date(asset.lastUpdated);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  
  // Consider data fresh if updated within last 24 hours
  return hoursDiff < 24;
};

/**
 * Clear search cache
 */
export const clearAssetSearchCache = (): void => {
  SEARCH_CACHE.clear();
  console.log("[EnhancedAssetAPI] Search cache cleared");
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    cacheSize: SEARCH_CACHE.size,
    apiKeyCached: !!cachedApiKey,
    apiKeyAge: cachedApiKey ? Date.now() - apiKeyCacheTime : 0
  };
};
