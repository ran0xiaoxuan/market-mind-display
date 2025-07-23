
import { useState, useEffect, useCallback } from 'react';
import websocketMarketDataService, { 
  WebSocketConnectionState, 
  RealTimePriceData 
} from '@/services/websocketMarketDataService';

export interface UseWebSocketMarketDataOptions {
  symbols?: string[];
  autoConnect?: boolean;
}

export const useWebSocketMarketData = (options: UseWebSocketMarketDataOptions = {}) => {
  const { symbols = [], autoConnect = true } = options;
  
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>(
    websocketMarketDataService.getConnectionState()
  );
  const [prices, setPrices] = useState<Map<string, RealTimePriceData>>(new Map());
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = websocketMarketDataService.on('connection:state', (state: WebSocketConnectionState) => {
      setConnectionState(state);
    });

    return unsubscribe;
  }, []);

  // Subscribe to price updates
  useEffect(() => {
    const unsubscribe = websocketMarketDataService.on('price:*', (priceData: RealTimePriceData) => {
      setPrices(prev => {
        const updated = new Map(prev);
        updated.set(priceData.symbol, priceData);
        return updated;
      });
    });

    return unsubscribe;
  }, []);

  // Subscribe to symbols when they change
  useEffect(() => {
    if (symbols.length > 0) {
      websocketMarketDataService.subscribe(symbols);
      setIsSubscribed(true);
      
      return () => {
        websocketMarketDataService.unsubscribe(symbols);
        setIsSubscribed(false);
      };
    }
  }, [symbols]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && connectionState.status === 'disconnected') {
      websocketMarketDataService.connect();
    }
  }, [autoConnect, connectionState.status]);

  const connect = useCallback(() => {
    websocketMarketDataService.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocketMarketDataService.disconnect();
  }, []);

  const subscribe = useCallback((newSymbols: string | string[]) => {
    websocketMarketDataService.subscribe(newSymbols);
  }, []);

  const unsubscribe = useCallback((symbolsToRemove: string | string[]) => {
    websocketMarketDataService.unsubscribe(symbolsToRemove);
  }, []);

  const getCurrentPrice = useCallback((symbol: string): RealTimePriceData | null => {
    return prices.get(symbol.toUpperCase()) || websocketMarketDataService.getCurrentPrice(symbol);
  }, [prices]);

  const isConnected = connectionState.status === 'connected';
  const isConnecting = connectionState.status === 'connecting' || connectionState.status === 'reconnecting';
  const hasError = connectionState.status === 'error';

  return {
    // Connection state
    connectionState,
    isConnected,
    isConnecting,
    hasError,
    
    // Data
    prices,
    getCurrentPrice,
    
    // Subscription state
    isSubscribed,
    subscribedSymbols: symbols,
    
    // Actions
    connect,
    disconnect,
    subscribe,
    unsubscribe
  };
};

export default useWebSocketMarketData;
