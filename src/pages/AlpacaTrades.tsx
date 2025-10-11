// Alpaca Trades Page
// Displays trading history from Alpaca integration

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, ArrowUpDown, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useNavigate } from "react-router-dom";
import { getTradeExecutions, AlpacaTradeExecution } from "@/services/alpacaService";
import { format } from "date-fns";

export default function AlpacaTrades() {
  const { user } = useAuth();
  const { tier: subscriptionTier, isLoading: subscriptionLoading } = useUserSubscription();
  const isPro = subscriptionTier === 'pro' || subscriptionTier === 'premium';
  const navigate = useNavigate();

  const [trades, setTrades] = useState<AlpacaTradeExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!subscriptionLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isPro) {
        navigate('/pricing');
      }
    }
  }, [user, isPro, subscriptionLoading, navigate]);

  useEffect(() => {
    const loadTrades = async () => {
      if (!isPro) return;

      try {
        setIsLoading(true);
        const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
        const data = await getTradeExecutions(filters);
        setTrades(data);
      } catch (error) {
        console.error('Error loading trades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!subscriptionLoading) {
      loadTrades();
    }
  }, [isPro, subscriptionLoading, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      filled: 'bg-green-500',
      submitted: 'bg-blue-500',
      pending: 'bg-yellow-500',
      partially_filled: 'bg-orange-500',
      cancelled: 'bg-gray-500',
      failed: 'bg-red-500',
      rejected: 'bg-red-600',
    };

    return (
      <Badge className={variants[status] || 'bg-gray-500'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getSideIcon = (side: string) => {
    return side === 'buy' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  if (subscriptionLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </div>
    );
  }

  if (!isPro) {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-6 px-4 md:px-8 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Alpaca Trading History</h1>
            <p className="text-muted-foreground">
              View all trades executed through your Alpaca integration
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trade Executions</CardTitle>
                  <CardDescription>
                    {trades.length} trade{trades.length !== 1 ? 's' : ''} total
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partially_filled">Partially Filled</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" asChild>
                    <a href="/settings?tab=live-trading">
                      Settings
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {trades.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold mb-2">No trades yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your Alpaca trades will appear here once your strategies generate signals
                  </p>
                  <Button asChild>
                    <a href="/strategies">View Strategies</a>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Filled Qty</TableHead>
                        <TableHead className="text-right">Avg Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="font-mono text-xs">
                            {trade.created_at 
                              ? format(new Date(trade.created_at), 'MM/dd HH:mm:ss')
                              : '-'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {trade.symbol}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getSideIcon(trade.side)}
                              <span className="capitalize">{trade.side}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {trade.order_type.replace('_', ' ')}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {trade.quantity.toFixed(4)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {trade.limit_price 
                              ? `$${trade.limit_price.toFixed(2)}`
                              : 'Market'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {trade.filled_quantity 
                              ? trade.filled_quantity.toFixed(4)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {trade.filled_avg_price 
                              ? `$${trade.filled_avg_price.toFixed(2)}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(trade.status)}
                          </TableCell>
                          <TableCell>
                            {trade.alpaca_order_id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs font-mono"
                                asChild
                              >
                                <a
                                  href={`https://alpaca.markets`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                >
                                  {trade.alpaca_order_id.substring(0, 8)}...
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {trades.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Showing {trades.length} trade{trades.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

