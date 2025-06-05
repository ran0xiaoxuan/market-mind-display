
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RateLimiterState {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const RATE_LIMITS = {
  strategy_generation: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  backtest_execution: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  api_calls: { limit: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
};

export const useRateLimit = () => {
  const { user } = useAuth();
  const [rateLimitState, setRateLimitState] = useState<RateLimiterState>({});

  const checkRateLimit = (action: keyof typeof RATE_LIMITS): boolean => {
    if (!user) return false;

    const key = `${user.id}_${action}`;
    const config = RATE_LIMITS[action];
    const now = Date.now();
    
    const current = rateLimitState[key];
    
    // If no previous state or window has expired, allow and reset
    if (!current || now > current.resetTime) {
      setRateLimitState(prev => ({
        ...prev,
        [key]: {
          count: 1,
          resetTime: now + config.windowMs
        }
      }));
      return true;
    }
    
    // If within limit, increment and allow
    if (current.count < config.limit) {
      setRateLimitState(prev => ({
        ...prev,
        [key]: {
          ...current,
          count: current.count + 1
        }
      }));
      return true;
    }
    
    // Rate limit exceeded
    return false;
  };

  const getRemainingAttempts = (action: keyof typeof RATE_LIMITS): number => {
    if (!user) return 0;

    const key = `${user.id}_${action}`;
    const config = RATE_LIMITS[action];
    const current = rateLimitState[key];
    
    if (!current || Date.now() > current.resetTime) {
      return config.limit;
    }
    
    return Math.max(0, config.limit - current.count);
  };

  const getResetTime = (action: keyof typeof RATE_LIMITS): number => {
    if (!user) return 0;

    const key = `${user.id}_${action}`;
    const current = rateLimitState[key];
    
    return current?.resetTime || 0;
  };

  return {
    checkRateLimit,
    getRemainingAttempts,
    getResetTime
  };
};

// Input sanitization utility
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 5000); // Limit length
};

// Validate strategy generation prompt
export const validateStrategyPrompt = (prompt: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(prompt);
  
  if (sanitized.length < 10) {
    return { isValid: false, error: 'Prompt must be at least 10 characters long' };
  }
  
  if (sanitized.length > 5000) {
    return { isValid: false, error: 'Prompt must be less than 5000 characters' };
  }
  
  // Check for potentially harmful content
  const harmfulPatterns = [
    /delete\s+from/gi,
    /drop\s+table/gi,
    /insert\s+into/gi,
    /update\s+set/gi,
    /<script/gi,
    /eval\s*\(/gi,
    /function\s*\(/gi
  ];
  
  for (const pattern of harmfulPatterns) {
    if (pattern.test(sanitized)) {
      return { isValid: false, error: 'Prompt contains potentially harmful content' };
    }
  }
  
  return { isValid: true };
};
