
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getSupportedIndicators } from '@/services/taapiService';
import { Loader2, Search } from 'lucide-react';

interface IndicatorCategory {
  name: string;
  indicators: string[];
  description: string;
}

export function AvailableIndicators() {
  const [indicators, setIndicators] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        setLoading(true);
        const fetchedIndicators = await getSupportedIndicators();
        // Convert to proper case
        const formattedIndicators = fetchedIndicators
          .map(ind => ind.charAt(0).toUpperCase() + ind.slice(1))
          .sort();
        setIndicators(formattedIndicators);
        setError(null);
      } catch (err) {
        console.error('Error fetching indicators:', err);
        setError('Failed to load indicators. Please try again later.');
        // Set fallback indicators
        setIndicators([
          "SMA", "EMA", "RSI", "MACD", "Bollinger Bands", "ATR", 
          "Stochastic", "Ichimoku Cloud", "SuperTrend", "OBV"
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
  }, []);

  const categorizeIndicators = (): IndicatorCategory[] => {
    // Define categories
    const categories: IndicatorCategory[] = [
      {
        name: 'Trend',
        description: 'Indicators that identify market direction and strength',
        indicators: []
      },
      {
        name: 'Momentum',
        description: 'Indicators that measure the rate of price changes',
        indicators: []
      },
      {
        name: 'Volatility',
        description: 'Indicators that measure market fluctuations',
        indicators: []
      },
      {
        name: 'Volume',
        description: 'Indicators based on trading volume',
        indicators: []
      },
      {
        name: 'Oscillators',
        description: 'Indicators that fluctuate between two extremes',
        indicators: []
      },
      {
        name: 'Others',
        description: 'Specialized and custom indicators',
        indicators: []
      }
    ];

    // Categorize the indicators
    const trendIndicators = ['sma', 'ema', 'wma', 'dema', 'tema', 'trima', 'kama', 'mama', 't3', 'ichimoku', 'supertrend', 'vwap', 'hma', 'zlema', 'wilders'];
    const momentumIndicators = ['rsi', 'macd', 'adx', 'cci', 'mfi', 'mom', 'roc', 'trix', 'ultosc', 'willr', 'cmo', 'ppo', 'pvo', 'apo'];
    const volatilityIndicators = ['bbands', 'atr', 'natr', 'keltnerchannels', 'standarddeviation', 'chandelier', 'donchian'];
    const volumeIndicators = ['obv', 'ad', 'adosc', 'cmf', 'vwmacd'];
    const oscillatorIndicators = ['stoch', 'stochrsi', 'rsi', 'cci', 'macd', 'willr', 'ao'];

    indicators.forEach(indicator => {
      const lowerInd = indicator.toLowerCase();
      
      if (trendIndicators.some(ti => lowerInd.includes(ti))) {
        categories[0].indicators.push(indicator);
      } 
      else if (momentumIndicators.some(mi => lowerInd.includes(mi))) {
        categories[1].indicators.push(indicator);
      } 
      else if (volatilityIndicators.some(vi => lowerInd.includes(vi))) {
        categories[2].indicators.push(indicator);
      } 
      else if (volumeIndicators.some(vi => lowerInd.includes(vi))) {
        categories[3].indicators.push(indicator);
      } 
      else if (oscillatorIndicators.some(oi => lowerInd.includes(oi))) {
        categories[4].indicators.push(indicator);
      } 
      else {
        categories[5].indicators.push(indicator);
      }
    });

    // Filter by search query
    if (searchQuery) {
      categories.forEach(category => {
        category.indicators = category.indicators.filter(ind => 
          ind.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Only return categories with indicators
    return categories.filter(category => category.indicators.length > 0);
  };

  const categorizedIndicators = categorizeIndicators();
  const totalIndicatorsCount = indicators.length;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <CardTitle>Available Indicators</CardTitle>
            <CardDescription>{totalIndicatorsCount} technical indicators available</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search indicators..."
              className="w-full pl-8 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading indicators...</span>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-4">
            <p>{error}</p>
          </div>
        ) : categorizedIndicators.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No indicators found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categorizedIndicators.map((category, index) => (
              <div key={index}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{category.name}</h3>
                  <Badge variant="outline">{category.indicators.length}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                <div className="flex flex-wrap gap-2">
                  {category.indicators.map((indicator, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-slate-100">
                      {indicator}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
