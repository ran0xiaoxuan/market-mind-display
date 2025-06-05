
import { useState, useEffect } from "react";

interface RateLimit {
  count: number;
  lastReset: number;
}

const RATE_LIMITS = {
  email: { max: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  discord: { max: 30, windowMs: 60 * 60 * 1000 }, // 30 per hour
  telegram: { max: 30, windowMs: 60 * 60 * 1000 } // 30 per hour
};

export class NotificationRateLimiter {
  private static instance: NotificationRateLimiter;
  private rateLimits: Map<string, RateLimit> = new Map();

  static getInstance(): NotificationRateLimiter {
    if (!NotificationRateLimiter.instance) {
      NotificationRateLimiter.instance = new NotificationRateLimiter();
    }
    return NotificationRateLimiter.instance;
  }

  private getKey(userId: string, type: string): string {
    return `${userId}:${type}`;
  }

  private isRateLimitExceeded(userId: string, type: 'email' | 'discord' | 'telegram'): boolean {
    const key = this.getKey(userId, type);
    const now = Date.now();
    const limit = RATE_LIMITS[type];
    
    let rateLimit = this.rateLimits.get(key);
    
    if (!rateLimit) {
      rateLimit = { count: 0, lastReset: now };
      this.rateLimits.set(key, rateLimit);
    }
    
    // Reset counter if window has passed
    if (now - rateLimit.lastReset >= limit.windowMs) {
      rateLimit.count = 0;
      rateLimit.lastReset = now;
    }
    
    // Check if limit exceeded
    if (rateLimit.count >= limit.max) {
      return true;
    }
    
    // Increment counter
    rateLimit.count++;
    return false;
  }

  canSendNotification(userId: string, type: 'email' | 'discord' | 'telegram'): boolean {
    return !this.isRateLimitExceeded(userId, type);
  }

  getRemainingCount(userId: string, type: 'email' | 'discord' | 'telegram'): number {
    const key = this.getKey(userId, type);
    const rateLimit = this.rateLimits.get(key);
    const limit = RATE_LIMITS[type];
    
    if (!rateLimit) return limit.max;
    
    const now = Date.now();
    if (now - rateLimit.lastReset >= limit.windowMs) {
      return limit.max;
    }
    
    return Math.max(0, limit.max - rateLimit.count);
  }

  getTimeUntilReset(userId: string, type: 'email' | 'discord' | 'telegram'): number {
    const key = this.getKey(userId, type);
    const rateLimit = this.rateLimits.get(key);
    const limit = RATE_LIMITS[type];
    
    if (!rateLimit) return 0;
    
    const elapsed = Date.now() - rateLimit.lastReset;
    return Math.max(0, limit.windowMs - elapsed);
  }
}

// Hook for using rate limiter in components
export function useNotificationRateLimit() {
  const [rateLimiter] = useState(() => NotificationRateLimiter.getInstance());
  
  return {
    canSend: (userId: string, type: 'email' | 'discord' | 'telegram') => 
      rateLimiter.canSendNotification(userId, type),
    getRemainingCount: (userId: string, type: 'email' | 'discord' | 'telegram') => 
      rateLimiter.getRemainingCount(userId, type),
    getTimeUntilReset: (userId: string, type: 'email' | 'discord' | 'telegram') => 
      rateLimiter.getTimeUntilReset(userId, type)
  };
}
