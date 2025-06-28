
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export function TestEmailButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleTestEmail = async () => {
    setIsLoading(true);
    try {
      console.log('Triggering test email...');
      
      const { data, error } = await supabase.functions.invoke('test-email-notification', {
        body: {}
      });

      if (error) {
        console.error('Error sending test email:', error);
        toast.error(`Failed to send test email: ${error.message}`);
        return;
      }

      console.log('Test email response:', data);
      toast.success('Test email sent successfully! Check ran0xiaoxuan@gmail.com');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send test email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleTestEmail} 
      disabled={isLoading}
      className="mb-4"
    >
      {isLoading ? 'Sending...' : 'Send Test Email'}
    </Button>
  );
}
