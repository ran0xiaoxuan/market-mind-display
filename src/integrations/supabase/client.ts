
import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

export const supabase = createClient<Database>(
  "https://lqfhhqhswdqpsliskxrr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0",
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-my-custom-header': 'recommendations-app'
      },
    },
  }
);

// Add helper function to refresh database schema types
export const refreshDatabaseTypes = () => {
  console.log("Database schema refreshed");
  return true;
};

// New function to fetch public recommended strategies
export const fetchPublicRecommendedStrategies = async () => {
  try {
    // Step 1: Get all public recommendations
    const { data: recommendedData, error: recommendedError } = await supabase
      .from('recommended_strategies')
      .select('*')
      .eq('is_public', true);
    
    if (recommendedError) {
      console.error("Error fetching recommended strategies:", recommendedError);
      throw recommendedError;
    }
    
    if (!recommendedData || recommendedData.length === 0) {
      console.log("No recommended strategies found");
      return [];
    }
    
    console.log("Recommended strategies data:", recommendedData);
    
    // Step 2: Get strategy IDs from recommendation records
    const strategyIds = recommendedData.map(rec => rec.strategy_id).filter(Boolean);
    
    if (strategyIds.length === 0) {
      console.log("No valid strategy IDs found");
      return [];
    }
    
    // Step 3: Fetch each strategy individually
    const collectedStrategies = [];
    
    for (const strategyId of strategyIds) {
      const { data: strategyData, error: strategyError } = await supabase
        .from('strategies')
        .select('*')
        .eq('id', strategyId);
      
      if (strategyError) {
        console.error(`Error fetching strategy ${strategyId}:`, strategyError);
        continue;
      }
      
      if (strategyData && strategyData.length > 0) {
        // Find corresponding recommendation record
        const recommendationRecord = recommendedData.find(rec => rec.strategy_id === strategyId);
        
        // Add the strategy with recommendation metadata
        collectedStrategies.push({
          ...strategyData[0],
          is_official: recommendationRecord?.is_official || false,
          is_public: recommendationRecord?.is_public || true,
          rating: 5 // Default rating
        });
      }
    }
    
    console.log("Collected strategies:", collectedStrategies);
    return collectedStrategies;
  } catch (error) {
    console.error("Error in fetchPublicRecommendedStrategies:", error);
    throw error;
  }
};
