
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AISettings() {
  const [apiKey, setApiKey] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"none" | "valid" | "invalid">("none");

  const handleUpdateApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-openai-key", {
        body: { apiKey }
      });

      if (error) {
        console.error("Error updating OpenAI API key:", error);
        toast.error("Failed to update API key. Please try again.");
        setKeyStatus("invalid");
        return;
      }

      if (data.error) {
        console.error("API error:", data.error);
        toast.error(data.error || "Invalid API key. Please check and try again.");
        setKeyStatus("invalid");
        return;
      }

      toast.success("OpenAI API key updated successfully");
      setKeyStatus("valid");
      setApiKey(""); // Clear the input for security
    } catch (error) {
      console.error("Error updating API key:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setKeyStatus("invalid");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-medium">AI Service Settings</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Configure your AI services for chat and strategy generation
      </p>
      
      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium">OpenAI Integration</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Enter your OpenAI API key to enable AI features throughout the application.
              Your API key is stored securely and is not accessible after being saved.
            </p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="openai-key" className="block text-sm mb-2 font-medium">
                  OpenAI API Key
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className={`pr-10 ${
                        keyStatus === "valid" 
                          ? "border-green-500 focus-visible:ring-green-500" 
                          : keyStatus === "invalid" 
                            ? "border-red-500 focus-visible:ring-red-500" 
                            : ""
                      }`}
                    />
                    {keyStatus === "valid" && (
                      <CheckCircle className="w-5 h-5 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                    )}
                    {keyStatus === "invalid" && (
                      <AlertCircle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                    )}
                  </div>
                  <Button 
                    onClick={handleUpdateApiKey}
                    disabled={isUpdating || !apiKey.trim()} 
                    className="min-w-24"
                  >
                    {isUpdating ? "Updating..." : "Update Key"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  You can find your API key in your 
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 ml-1"
                  >
                    OpenAI dashboard
                  </a>
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                <div className="flex items-start gap-2">
                  <KeyRound className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium text-blue-700">API Configuration</span>
                    <p className="text-blue-600 mt-1">
                      The system is now configured to use the official OpenAI API endpoint:
                      <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 ml-1">
                        https://api.openai.com
                      </code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
