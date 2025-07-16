
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDailyTestSignalUsage, DailyTestSignalUsage } from "@/services/dailyTestSignalService";

export const useDailyTestSignalUsage = () => {
  const queryClient = useQueryClient();

  const {
    data: usage,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['daily-test-signal-usage'],
    queryFn: getDailyTestSignalUsage,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
  });

  const refreshUsage = () => {
    queryClient.invalidateQueries({ queryKey: ['daily-test-signal-usage'] });
  };

  return {
    usage: usage || { count: 0, limit: 20, remaining: 20, isLimitReached: false },
    isLoading,
    error,
    refreshUsage,
    refetch
  };
};
