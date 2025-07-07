
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { testNotificationSystem, testDiscordNotification, testTelegramNotification } from "@/services/testNotificationService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, MessageSquare, Send } from "lucide-react";

export const TestNotificationButton: React.FC = () => {
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const handleTestAll = async () => {
    setIsTestingAll(true);
    try {
      const result = await testNotificationSystem();
      
      if (result.success) {
        toast.success("Test notifications sent successfully!", {
          description: `Tested strategy: ${result.strategy}`
        });
      } else {
        toast.error("Test failed", {
          description: result.error
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error("Test failed", {
        description: error.message || "Unknown error occurred"
      });
    } finally {
      setIsTestingAll(false);
    }
  };

  const handleTestDiscord = async () => {
    setIsTestingDiscord(true);
    try {
      await testDiscordNotification();
      toast.success("Discord test notification sent!");
    } catch (error) {
      console.error('Discord test error:', error);
      toast.error("Discord test failed", {
        description: error.message
      });
    } finally {
      setIsTestingDiscord(false);
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    try {
      await testTelegramNotification();
      toast.success("Telegram test notification sent!");
    } catch (error) {
      console.error('Telegram test error:', error);
      toast.error("Telegram test failed", {
        description: error.message
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Test Notifications</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Test your notification settings to ensure they're working correctly.
        </p>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleTestAll}
            disabled={isTestingAll}
            className="flex items-center space-x-2"
          >
            <Bell className="h-4 w-4" />
            <span>{isTestingAll ? 'Testing All...' : 'Test All Notifications'}</span>
          </Button>
          
          <Button
            onClick={handleTestDiscord}
            disabled={isTestingDiscord}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{isTestingDiscord ? 'Testing...' : 'Test Discord'}</span>
          </Button>
          
          <Button
            onClick={handleTestTelegram}
            disabled={isTestingTelegram}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>{isTestingTelegram ? 'Testing...' : 'Test Telegram'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
