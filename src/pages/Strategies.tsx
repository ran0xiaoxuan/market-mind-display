
import { Navbar } from "@/components/Navbar";

const Strategies = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Strategies</h1>
        </div>
        <div className="p-10 text-center">
          <p className="text-muted-foreground">Strategies page coming soon</p>
        </div>
      </main>
    </div>
  );
};

export default Strategies;
