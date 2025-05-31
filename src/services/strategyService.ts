
import { supabase } from "@/integrations/supabase/client";

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  targetAsset?: string;
  targetAssetName?: string;
  isActive: boolean;
  timeframe: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  stopLoss?: string;
  takeProfit?: string;
  singleBuyVolume?: string;
  maxBuyVolume?: string;
}

export const getStrategies = async (): Promise<Strategy[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("strategies")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching strategies:", error);
    throw new Error("Failed to fetch strategies");
  }

  return data.map(strategy => ({
    id: strategy.id,
    name: strategy.name,
    description: strategy.description || "",
    targetAsset: strategy.target_asset || "",
    targetAssetName: strategy.target_asset_name || "",
    isActive: strategy.is_active,
    timeframe: strategy.timeframe,
    createdAt: strategy.created_at,
    updatedAt: strategy.updated_at,
    userId: strategy.user_id,
    stopLoss: strategy.stop_loss || "",
    takeProfit: strategy.take_profit || "",
    singleBuyVolume: strategy.single_buy_volume || "",
    maxBuyVolume: strategy.max_buy_volume || ""
  }));
};

export const deleteStrategy = async (strategyId: string): Promise<void> => {
  console.log("Attempting to delete strategy:", strategyId);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // First check if the strategy belongs to the user
  const { data: strategy, error: fetchError } = await supabase
    .from("strategies")
    .select("id, user_id, can_be_deleted")
    .eq("id", strategyId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !strategy) {
    console.error("Strategy not found or access denied:", fetchError);
    throw new Error("Strategy not found or you don't have permission to delete it");
  }

  // The database trigger will handle the deletion logic and cleanup
  const { error } = await supabase
    .from("strategies")
    .delete()
    .eq("id", strategyId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting strategy:", error);
    throw new Error(error.message || "Failed to delete strategy");
  }

  console.log("Strategy deleted successfully:", strategyId);
  
  // Dispatch a custom event to notify other components
  window.dispatchEvent(new CustomEvent('strategy-deleted', { detail: strategyId }));
};
