
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function Confirmed() {
  const navigate = useNavigate();

  const handleProceedToLogin = () => {
    navigate("/login");
  };

  return (
    <AuthLayout>
      <Card className="border shadow-sm">
        <CardHeader className="pb-0">
          <h1 className="text-xl font-semibold text-center">Email Confirmed!</h1>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Welcome to StratAlge!</h3>
            <p className="text-sm text-muted-foreground">
              Your email has been successfully verified. You can now sign in to your account and start creating trading strategies.
            </p>
            <div className="pt-4">
              <Button onClick={handleProceedToLogin} className="w-full">
                Sign In to Your Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
