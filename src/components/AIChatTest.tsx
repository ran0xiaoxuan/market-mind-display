
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { 
  ChatMessage, 
  createUserMessage, 
  extractAssistantMessage, 
  sendChatCompletion 
} from "@/services/moonshotService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const AIChatTest = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: "You are a helpful trading assistant. Be concise and informative." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to the chat
      const userMessage = createUserMessage(input);
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      
      // Send request to OpenAI
      const response = await sendChatCompletion({
        messages: updatedMessages,
        temperature: 0.7,
      });
      
      // Extract and add AI response
      const aiMessageContent = extractAssistantMessage(response);
      setMessages([...updatedMessages, { role: "assistant", content: aiMessageContent }]);
    } catch (error: any) {
      console.error("Error sending chat completion:", error);
      setError(error.message || "Failed to get AI response");
      
      // Check if this is an API key error
      if (error.message?.includes("API key") || error.message?.includes("api_key_error")) {
        toast.error("Missing or invalid API key. Please update your OpenAI API key in settings.");
      } else {
        toast.error("Failed to get AI response. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goToSettings = () => {
    navigate('/settings');
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>OpenAI Chat Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && error.toLowerCase().includes("api key") && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Key Error</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={goToSettings}
              >
                Go to Settings to Update API Key
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto p-2">
          {messages.slice(1).map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === "user" 
                  ? "bg-primary text-primary-foreground ml-12" 
                  : "bg-muted text-foreground mr-12"
              }`}
            >
              <p className="text-sm font-medium mb-1">
                {message.role === "user" ? "You" : "AI Assistant"}:
              </p>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
          {messages.length === 1 && (
            <p className="text-center text-muted-foreground">
              No messages yet. Start a conversation!
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default AIChatTest;
