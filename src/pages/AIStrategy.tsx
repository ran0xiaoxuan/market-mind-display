
import { Navbar } from "@/components/Navbar";

const AIStrategy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">AI Strategy</h1>
        </div>
        <div className="p-10 text-center">
          <p className="text-muted-foreground">AI Strategy page coming soon</p>
        </div>
      </main>
    </div>
  );
};

export default AIStrategy;
