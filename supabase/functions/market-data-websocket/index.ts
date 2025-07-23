
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClientConnection {
  socket: WebSocket;
  subscribedSymbols: Set<string>;
  id: string;
}

class MarketDataWebSocketRelay {
  private clients = new Map<string, ClientConnection>();
  private fmpSocket: WebSocket | null = null;
  private subscribedSymbols = new Set<string>();
  private reconnectTimer: number | null = null;
  private isConnecting = false;

  async handleClient(req: Request): Promise<Response> {
    const { headers } = req;
    const upgradeHeader = headers.get("upgrade") || "";

    if (upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket connection", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    const clientId = crypto.randomUUID();
    
    const client: ClientConnection = {
      socket,
      subscribedSymbols: new Set(),
      id: clientId
    };

    socket.onopen = () => {
      console.log(`[MarketDataRelay] Client ${clientId} connected`);
      this.clients.set(clientId, client);
      this.ensureFMPConnection();
      
      // Send connection status
      this.sendToClient(client, {
        type: 'connection_status',
        status: 'connected',
        clientId
      });
    };

    socket.onmessage = (event) => {
      this.handleClientMessage(client, event.data);
    };

    socket.onclose = () => {
      console.log(`[MarketDataRelay] Client ${clientId} disconnected`);
      this.clients.delete(clientId);
      this.updateFMPSubscriptions();
    };

    socket.onerror = (error) => {
      console.error(`[MarketDataRelay] Client ${clientId} error:`, error);
      this.clients.delete(clientId);
    };

    return response;
  }

  private async ensureFMPConnection() {
    if (this.fmpSocket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    
    try {
      console.log('[MarketDataRelay] Connecting to FMP WebSocket...');
      
      // Get FMP API key
      const fmpApiKey = Deno.env.get('FMP_API_KEY');
      if (!fmpApiKey) {
        throw new Error('FMP_API_KEY not configured');
      }

      // Connect to FMP WebSocket (using their real-time endpoint)
      const fmpWsUrl = `wss://websockets.financialmodelingprep.com?apikey=${fmpApiKey}`;
      this.fmpSocket = new WebSocket(fmpWsUrl);

      this.fmpSocket.onopen = () => {
        console.log('[MarketDataRelay] Connected to FMP WebSocket');
        this.isConnecting = false;
        this.updateFMPSubscriptions();
      };

      this.fmpSocket.onmessage = (event) => {
        this.handleFMPMessage(event.data);
      };

      this.fmpSocket.onclose = (event) => {
        console.log('[MarketDataRelay] FMP connection closed:', event.code, event.reason);
        this.fmpSocket = null;
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.fmpSocket.onerror = (error) => {
        console.error('[MarketDataRelay] FMP WebSocket error:', error);
        this.fmpSocket = null;
        this.isConnecting = false;
        this.scheduleReconnect();
      };

    } catch (error) {
      console.error('[MarketDataRelay] Failed to connect to FMP:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleClientMessage(client: ClientConnection, data: string) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(client, message.symbols);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(client, message.symbols);
          break;
        case 'ping':
          this.sendToClient(client, { type: 'pong' });
          break;
        default:
          console.warn('[MarketDataRelay] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[MarketDataRelay] Failed to parse client message:', error);
    }
  }

  private handleSubscribe(client: ClientConnection, symbols: string[]) {
    if (!Array.isArray(symbols)) return;
    
    symbols.forEach(symbol => {
      const upperSymbol = symbol.toUpperCase();
      client.subscribedSymbols.add(upperSymbol);
      this.subscribedSymbols.add(upperSymbol);
    });
    
    console.log(`[MarketDataRelay] Client ${client.id} subscribed to:`, symbols);
    this.updateFMPSubscriptions();
  }

  private handleUnsubscribe(client: ClientConnection, symbols: string[]) {
    if (!Array.isArray(symbols)) return;
    
    symbols.forEach(symbol => {
      client.subscribedSymbols.delete(symbol.toUpperCase());
    });
    
    this.updateGlobalSubscriptions();
    this.updateFMPSubscriptions();
  }

  private updateGlobalSubscriptions() {
    // Rebuild global subscriptions from all clients
    this.subscribedSymbols.clear();
    this.clients.forEach(client => {
      client.subscribedSymbols.forEach(symbol => {
        this.subscribedSymbols.add(symbol);
      });
    });
  }

  private updateFMPSubscriptions() {
    if (this.fmpSocket?.readyState !== WebSocket.OPEN) return;
    
    if (this.subscribedSymbols.size > 0) {
      const symbols = Array.from(this.subscribedSymbols);
      console.log('[MarketDataRelay] Updating FMP subscriptions:', symbols);
      
      // Subscribe to real-time prices
      this.fmpSocket.send(JSON.stringify({
        event: 'subscribe',
        data: {
          ticker: symbols.join(',')
        }
      }));
    }
  }

  private handleFMPMessage(data: string) {
    try {
      const message = JSON.parse(data);
      
      // Handle different FMP message types
      if (message.s && message.p !== undefined) {
        // Real-time price update
        const priceData = {
          type: 'price_update',
          data: {
            symbol: message.s,
            price: parseFloat(message.p),
            change: parseFloat(message.c || 0),
            changePercent: parseFloat(message.cp || 0),
            volume: parseInt(message.v || 0),
            timestamp: Date.now()
          }
        };
        
        this.broadcastToSubscribedClients(message.s, priceData);
      } else {
        console.log('[MarketDataRelay] Received FMP message:', message);
      }
    } catch (error) {
      console.error('[MarketDataRelay] Failed to parse FMP message:', error);
    }
  }

  private broadcastToSubscribedClients(symbol: string, data: any) {
    const upperSymbol = symbol.toUpperCase();
    
    this.clients.forEach(client => {
      if (client.subscribedSymbols.has(upperSymbol)) {
        this.sendToClient(client, data);
      }
    });
  }

  private sendToClient(client: ClientConnection, data: any) {
    try {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error('[MarketDataRelay] Failed to send to client:', error);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    console.log('[MarketDataRelay] Scheduling FMP reconnect in 5 seconds...');
    this.reconnectTimer = setTimeout(() => {
      this.ensureFMPConnection();
    }, 5000);
  }
}

const relay = new MarketDataWebSocketRelay();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return await relay.handleClient(req);
  } catch (error) {
    console.error('[MarketDataRelay] Request handling error:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
