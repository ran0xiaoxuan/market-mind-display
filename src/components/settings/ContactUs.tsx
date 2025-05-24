
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export function ContactUs() {
  return <div>
      <h2 className="text-xl font-medium mb-4">Contact Us</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Get in touch with our team and community
      </p>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <img src="/lovable-uploads/6a521ef5-b54b-46fd-9cab-8644b0d9a54d.png" alt="Discord Logo" className="h-10 w-10" />
              <div>
                <h3 className="font-medium">Join our Discord</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with our community and get real-time support
                </p>
              </div>
              <Button variant="outline" className="w-full border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => window.open('https://discord.gg/r23GKXRx43', '_blank')}>
                
                Join Discord
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <img src="/lovable-uploads/937c84bf-6c2e-426b-87f8-c1ada1bef19d.png" alt="X Logo" className="h-10 w-10" />
              <div>
                <h3 className="font-medium">Follow us on X</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Stay updated with our latest news and announcements
                </p>
              </div>
              <Button variant="outline" className="w-full border-black/20 hover:bg-black/5 hover:text-black" onClick={() => window.open('https://x.com/StratAIge_cc', '_blank')}>
                
                Follow on X
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
