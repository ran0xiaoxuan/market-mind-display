
import { AIChatTest } from "@/components/AIChatTest";
import { Navbar } from "@/components/Navbar";

const AITest = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Moonshot AI Test</h1>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <AIChatTest />
        </div>
      </main>
    </div>
  );
};

export default AITest;
