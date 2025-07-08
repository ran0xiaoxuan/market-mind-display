
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEDT/AEST)' },
];

export function TimezoneSettings() {
  const [timezone, setTimezone] = useState<string>('UTC');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTimezone();
  }, []);

  const loadTimezone = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.user.id)
        .single();

      if (profile?.timezone) {
        setTimezone(profile.timezone);
      } else {
        // Try to detect user's timezone
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (COMMON_TIMEZONES.find(tz => tz.value === detectedTimezone)) {
          setTimezone(detectedTimezone);
        }
      }
    } catch (error) {
      console.error('Error loading timezone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTimezone = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ timezone })
        .eq('id', user.user.id);

      if (error) throw error;

      toast.success('Timezone preference saved successfully');
    } catch (error) {
      console.error('Error saving timezone:', error);
      toast.error('Failed to save timezone preference');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timezone Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading timezone settings...</p>
        </CardContent>
      </Card>
    );
  }

  const currentTime = new Date().toLocaleString("en-US", {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timezone Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Preferred Timezone
          </label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Current time in selected timezone:</p>
          <p className="text-sm font-medium">{currentTime}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          This timezone will be used for all trading signal notifications sent via Email, Discord, and Telegram.
        </p>

        <Button onClick={saveTimezone} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Timezone'}
        </Button>
      </CardContent>
    </Card>
  );
}
