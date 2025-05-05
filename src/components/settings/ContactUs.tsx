
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Discord, Twitter } from "lucide-react";

export function ContactUs() {
  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Contact Us</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Get in touch with our team and community
      </p>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Discord className="h-10 w-10 text-indigo-600" />
              <div>
                <h3 className="font-medium">Join our Discord</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with our community and get real-time support
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                onClick={() => window.open('https://discord.gg/tradingapp', '_blank')}
              >
                <Discord className="mr-2 h-4 w-4" />
                Join Discord
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Twitter className="h-10 w-10 text-blue-500" />
              <div>
                <h3 className="font-medium">Follow us on X</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Stay updated with our latest news and announcements
                </p>
              </div>
              <Button 
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => window.open('https://twitter.com/tradingappofficial', '_blank')}
              >
                <Twitter className="mr-2 h-4 w-4" />
                Follow on X
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
