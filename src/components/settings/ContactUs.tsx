
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
              <img src="/lovable-uploads/8e55b325-1f5f-4fc9-98de-a7e5ececd214.png" alt="Discord Logo" className="h-10 w-10" />
              <div>
                <h3 className="font-medium">Join our Discord</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with our community and get real-time support
                </p>
              </div>
              <Button variant="outline" className="w-full border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => window.open('https://discord.gg/hjyC8bSrxT', '_blank')}>
                Join Discord
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <img src="/lovable-uploads/f494ada1-aa19-4bed-819d-b714f9deebad.png" alt="Telegram Logo" className="h-10 w-10" />
              <div>
                <h3 className="font-medium">Join our Telegram</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Stay updated with our latest news and announcements
                </p>
              </div>
              <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50 hover:text-blue-700" onClick={() => window.open('https://t.me/strataige', '_blank')}>
                Join Telegram
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
