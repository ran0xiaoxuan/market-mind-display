import { supabase } from "@/integrations/supabase/client";

export interface WebSocketConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';
  error?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
}

export interface RealTimePriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface RealTimeOHLCVData {
  symbol: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

class WebSocketMarketDataService {
  private ws: WebSocket | null = null;
  private connectionState: WebSocketConnectionState = {
    status: 'disconnected',
    reconnectAttempts: 0
  };
  private subscribedSymbols = new Set<string>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private listeners = new Map<string, Set<(data: any) => void>>();
  private priceCache = new Map<string, RealTimePriceData>();
  
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_BASE_DELAY = 1000;
  private readonly HEARTBEAT_INTERVAL = 30000;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for page visibility changes to manage connections
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseConnection();
      } else {
        this.resumeConnection();
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => this.connect());
    window.addEventListener('offline', () => this.disconnect());
  }

  async connect(): Promise<void> {
    if (this.connectionState.status === 'connecting' || this.connectionState.status === 'connected') {
      return;
    }

    try {
      this.updateConnectionState({ status: 'connecting' });
      console.log('[WebSocketMarketData] Connecting to market data stream...');

      // Connect through our Supabase Edge Function WebSocket relay
      const wsUrl = `wss://lqfhhqhswdqpsliskxrr.functions.supabase.co/market-data-websocket`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocketMarketData] Connected to market data stream');
        this.updateConnectionState({ 
          status: 'connected', 
          lastConnected: new Date(),
          reconnectAttempts: 0 
        });
        this.startHeartbeat();
        this.resubscribeToSymbols();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocketMarketData] Connection closed:', event.code, event.reason);
        this.updateConnectionState({ status: 'disconnected' });
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocketMarketData] WebSocket error:', error);
        this.updateConnectionState({ 
          status: 'error', 
          error: 'WebSocket connection failed' 
        });
      };

    } catch (error) {
      console.error('[WebSocketMarketData] Failed to connect:', error);
      this.updateConnectionState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Connection failed' 
      });
      this.scheduleReconnect();
    }
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'price_update':
          this.handlePriceUpdate(message.data);
          break;
        case 'ohlcv_update':
          this.handleOHLCVUpdate(message.data);
          break;
        case 'error':
          console.error('[WebSocketMarketData] Server error:', message.error);
          break;
        case 'pong':
          // Heartbeat response
          break;
        default:
          console.warn('[WebSocketMarketData] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[WebSocketMarketData] Failed to parse message:', error);
    }
  }

  private handlePriceUpdate(data: RealTimePriceData) {
    // Update cache
    this.priceCache.set(data.symbol, data);
    
    // Notify listeners
    this.notifyListeners(`price:${data.symbol}`, data);
    this.notifyListeners('price:*', data);
  }

  private handleOHLCVUpdate(data: RealTimeOHLCVData) {
    this.notifyListeners(`ohlcv:${data.symbol}:${data.timeframe}`, data);
    this.notifyListeners('ohlcv:*', data);
  }

  private notifyListeners(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[WebSocketMarketData] Listener error:', error);
        }
      });
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.connectionState.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocketMarketData] Max reconnection attempts reached');
      this.updateConnectionState({ 
        status: 'error', 
        error: 'Max reconnection attempts reached' 
      });
      return;
    }

    const delay = this.RECONNECT_BASE_DELAY * Math.pow(2, this.connectionState.reconnectAttempts);
    console.log(`[WebSocketMarketData] Scheduling reconnect in ${delay}ms`);
    
    this.updateConnectionState({ 
      status: 'reconnecting',
      reconnectAttempts: this.connectionState.reconnectAttempts + 1 
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private updateConnectionState(updates: Partial<WebSocketConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.notifyListeners('connection:state', this.connectionState);
  }

  private resubscribeToSymbols() {
    if (this.subscribedSymbols.size > 0) {
      const symbols = Array.from(this.subscribedSymbols);
      console.log('[WebSocketMarketData] Resubscribing to symbols:', symbols);
      this.sendMessage({
        type: 'subscribe',
        symbols: symbols
      });
    }
  }

  private sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocketMarketData] Cannot send message - not connected');
    }
  }

  // Public API
  subscribe(symbols: string | string[]): void {
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
    
    symbolArray.forEach(symbol => {
      this.subscribedSymbols.add(symbol.toUpperCase());
    });

    if (this.connectionState.status === 'connected') {
      this.sendMessage({
        type: 'subscribe',
        symbols: symbolArray
      });
    }

    console.log('[WebSocketMarketData] Subscribed to symbols:', symbolArray);
  }

  unsubscribe(symbols: string | string[]): void {
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
    
    symbolArray.forEach(symbol => {
      this.subscribedSymbols.delete(symbol.toUpperCase());
    });

    if (this.connectionState.status === 'connected') {
      this.sendMessage({
        type: 'unsubscribe',
        symbols: symbolArray
      });
    }

    console.log('[WebSocketMarketData] Unsubscribed from symbols:', symbolArray);
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  getCurrentPrice(symbol: string): RealTimePriceData | null {
    return this.priceCache.get(symbol.toUpperCase()) || null;
  }

  getConnectionState(): WebSocketConnectionState {
    return { ...this.connectionState };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.updateConnectionState({ status: 'disconnected' });
  }

  private pauseConnection() {
    // Pause heartbeat but keep connection open
    this.stopHeartbeat();
  }

  private resumeConnection() {
    if (this.connectionState.status === 'connected') {
      this.startHeartbeat();
    } else if (this.connectionState.status === 'disconnected') {
      this.connect();
    }
  }
}

// Create singleton instance
export const websocketMarketDataService = new WebSocketMarketDataService();

// Auto-connect when service is imported
websocketMarketDataService.connect();

export default websocketMarketDataService;
