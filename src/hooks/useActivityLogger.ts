
import { recordActivity } from "@/services/activityService";
import { toast } from "sonner";

export const useActivityLogger = () => {
  const logActivity = async (
    type: 'generate' | 'edit' | 'enable' | 'disable' | 'backtest',
    title: string,
    description: string,
    strategyName?: string
  ) => {
    try {
      await recordActivity(type, title, description, strategyName);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't show toast for activity logging failures to avoid disrupting user experience
    }
  };

  return { logActivity };
};
