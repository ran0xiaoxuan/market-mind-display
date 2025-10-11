// Live Trading Settings Component
// Allows PRO users to configure Alpaca API integration

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import {
  getAlpacaConfiguration,
  saveAlpacaConfiguration,
  deleteAlpacaConfiguration,
  toggleAlpacaActive,
  testAlpacaConnection,
  getAlpacaAccount,
  AlpacaConfiguration,
} from "@/services/alpacaService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const LiveTradingSettings = () => {
  const { user } = useAuth();
  const { tier: subscriptionTier, isLoading: subscriptionLoading } = useUserSubscription();
  const isPro = subscriptionTier === 'pro' || subscriptionTier === 'premium';

  const [config, setConfig] = useState<AlpacaConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  // Form state
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isPaperTrading, setIsPaperTrading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  // Load existing configuration
  useEffect(() => {
    const loadConfig = async () => {
      if (!isPro) return;

      try {
        setIsLoading(true);
        const data = await getAlpacaConfiguration();
        if (data) {
          setConfig(data);
          setApiKey(data.api_key);
          setApiSecret(data.api_secret);
          setIsPaperTrading(data.is_paper_trading);

          // Load account info if active
          if (data.is_active && data.verification_status === 'verified') {
            loadAccountInfo();
          }
        }
      } catch (error) {
        console.error('Error loading Alpaca config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!subscriptionLoading) {
      loadConfig();
    }
  }, [isPro, subscriptionLoading]);

  const loadAccountInfo = async () => {
    try {
      const account = await getAlpacaAccount();
      setAccountInfo(account);
    } catch (error) {
      console.error('Error loading account info:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      toast.error("Please enter both API Key and API Secret");
      return;
    }

    try {
      setIsLoading(true);
      const savedConfig = await saveAlpacaConfiguration({
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        is_paper_trading: isPaperTrading,
      });

      setConfig(savedConfig);
      toast.success("Alpaca configuration saved successfully!");
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error(`Failed to save configuration: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config) {
      toast.error("Please save your configuration first");
      return;
    }

    try {
      setIsTesting(true);
      const result = await testAlpacaConnection();

      if (result.success) {
        toast.success("Connection successful! ✓");
        // Reload config to get updated verification status
        const updatedConfig = await getAlpacaConfiguration();
        if (updatedConfig) {
          setConfig(updatedConfig);
          if (result.account) {
            setAccountInfo(result.account);
          }
        }
      } else {
        toast.error(`Connection failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleActive = async (active: boolean) => {
    if (!config) return;

    if (active && config.verification_status !== 'verified') {
      toast.error("Please test the connection first before activating");
      return;
    }

    try {
      await toggleAlpacaActive(active);
      setConfig({ ...config, is_active: active });
      toast.success(active ? "Live trading activated!" : "Live trading deactivated");
    } catch (error: any) {
      console.error('Error toggling active:', error);
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteAlpacaConfiguration();
      setConfig(null);
      setApiKey("");
      setApiSecret("");
      setIsPaperTrading(true);
      setAccountInfo(null);
      setShowDeleteDialog(false);
      toast.success("Alpaca configuration deleted");
    } catch (error: any) {
      console.error('Error deleting config:', error);
      toast.error(`Failed to delete: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Live Trading (PRO Feature)
          </CardTitle>
          <CardDescription>
            Upgrade to PRO to connect your Alpaca account and enable automatic trade execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-6 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">Unlock Live Trading</p>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Alpaca brokerage account and let your strategies execute trades automatically
            </p>
            <Button asChild>
              <a href="/pricing">Upgrade to PRO</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      {config && (
        <Card className={config.is_active ? "border-green-500" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {config.is_active ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                Connection Status
              </span>
              <Switch
                checked={config.is_active}
                onCheckedChange={handleToggleActive}
                disabled={config.verification_status !== 'verified'}
              />
            </CardTitle>
            <CardDescription>
              {config.is_active
                ? "Live trading is active - your strategies will execute trades automatically"
                : "Live trading is inactive - enable to start automatic trading"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trading Mode</span>
                <span className="font-medium">
                  {config.is_paper_trading ? "Paper Trading (Test)" : "Live Trading"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Verification Status</span>
                <span className="flex items-center gap-1">
                  {config.verification_status === 'verified' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">Verified</span>
                    </>
                  )}
                  {config.verification_status === 'failed' && (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-500">Failed</span>
                    </>
                  )}
                  {config.verification_status === 'pending' && (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-500">Pending</span>
                    </>
                  )}
                </span>
              </div>
              {config.last_verified_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Verified</span>
                  <span className="text-sm">
                    {new Date(config.last_verified_at).toLocaleString()}
                  </span>
                </div>
              )}
              {accountInfo && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Account Value</span>
                    <span className="font-medium flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {parseFloat(accountInfo.equity).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Buying Power</span>
                    <span className="font-medium">
                      ${parseFloat(accountInfo.buying_power).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Alpaca API Configuration</CardTitle>
          <CardDescription>
            Connect your Alpaca brokerage account to enable automatic trade execution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Alpaca API Key"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <div className="flex gap-2">
              <Input
                id="apiSecret"
                type={showApiSecret ? "text" : "password"}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your Alpaca API Secret"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowApiSecret(!showApiSecret)}
              >
                {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="paperTrading">Paper Trading Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use paper trading (recommended for testing)
              </p>
            </div>
            <Switch
              id="paperTrading"
              checked={isPaperTrading}
              onCheckedChange={setIsPaperTrading}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isLoading || !apiKey.trim() || !apiSecret.trim()}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>

            {config && (
              <>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>

          <div className="mt-4 rounded-lg bg-muted p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              How to get Alpaca API Keys
            </h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Sign up for a free Alpaca account</li>
              <li>Go to your Alpaca dashboard</li>
              <li>Navigate to "API Keys" section</li>
              <li>Generate new API key and secret</li>
              <li>Copy and paste them here</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alpaca Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your Alpaca API configuration. You will need to reconfigure
              it to enable live trading again. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

