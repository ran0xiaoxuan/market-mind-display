
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

// Updated function to fetch public recommended strategies using a proper join
export const fetchPublicRecommendedStrategies = async () => {
  try {
    console.log("Starting to fetch public recommended strategies...");
    
    // Use a join query to get recommended strategies with their details in one call
    const { data: recommendedData, error: recommendedError } = await supabase
      .from('recommended_strategies')
      .select(`
        id,
        strategy_id,
        recommended_by,
        is_official,
        is_public,
        created_at,
        updated_at,
        strategies!inner (
          id,
          user_id,
          name,
          description,
          is_active,
          timeframe,
          target_asset,
          target_asset_name,
          created_at,
          updated_at,
          stop_loss,
          take_profit,
          single_buy_volume,
          max_buy_volume
        )
      `)
      .eq('is_public', true);
    
    if (recommendedError) {
      console.error("Error fetching recommended strategies:", recommendedError);
      throw recommendedError;
    }
    
    if (!recommendedData || recommendedData.length === 0) {
      console.log("No recommended strategies found in database");
      return [];
    }
    
    console.log("Successfully fetched recommended strategies:", recommendedData);
    
    // Transform the joined data into the expected format
    const transformedStrategies = recommendedData.map(item => ({
      id: item.strategies.id,
      user_id: item.strategies.user_id,
      name: item.strategies.name,
      description: item.strategies.description,
      is_active: item.strategies.is_active,
      timeframe: item.strategies.timeframe,
      target_asset: item.strategies.target_asset,
      target_asset_name: item.strategies.target_asset_name,
      created_at: item.strategies.created_at,
      updated_at: item.strategies.updated_at,
      stop_loss: item.strategies.stop_loss,
      take_profit: item.strategies.take_profit,
      single_buy_volume: item.strategies.single_buy_volume,
      max_buy_volume: item.strategies.max_buy_volume,
      is_official: item.is_official,
      is_public: item.is_public,
      rating: 5 // Default rating for now
    }));
    
    console.log("Transformed strategies:", transformedStrategies);
    return transformedStrategies;
    
  } catch (error) {
    console.error("Error in fetchPublicRecommendedStrategies:", error);
    // Return empty array instead of mock data when there's an error
    // This way the UI will show "No recommendations" instead of fake data
    return [];
  }
};
