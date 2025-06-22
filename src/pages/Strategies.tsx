import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/Navbar";
import { StrategyList } from "@/components/StrategyList";
import { FilterBar } from "@/components/FilterBar";
import { usePageTitle } from "@/hooks/usePageTitle";

const Strategies = () => {
  usePageTitle("Strategies - StratAIge");
  
  const [filters, setFilters] = useState({
    status: "all",
    asset: "all",
    sort: "newest",
  });

  const { data: strategies, isLoading, isError } = useQuery({
    queryKey: ["strategies", filters],
    queryFn: async () => {
      // Simulate fetching strategies from an API
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockStrategies = [
        {
          id: "1",
          name: "Momentum Master",
          asset: "AAPL",
          status: "active",
          returns: "15.2%",
          risk: "low",
        },
        {
          id: "2",
          name: "Trend Tracker",
          asset: "BTC",
          status: "paused",
          returns: "8.9%",
          risk: "medium",
        },
        {
          id: "3",
          name: "Value Vault",
          asset: "GOOGL",
          status: "active",
          returns: "12.5%",
          risk: "low",
        },
      ];

      // Apply filters
      let filteredStrategies = mockStrategies;
      if (filters.status !== "all") {
        filteredStrategies = filteredStrategies.filter(
          (strategy) => strategy.status === filters.status
        );
      }
      if (filters.asset !== "all") {
        filteredStrategies = filteredStrategies.filter(
          (strategy) => strategy.asset === filters.asset
        );
      }

      // Apply sorting
      if (filters.sort === "newest") {
        filteredStrategies = [...filteredStrategies].sort((a, b) =>
          a.id > b.id ? -1 : 1
        );
      }

      return filteredStrategies;
    },
  });

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  return (
    <div>
      <Navbar />
      <Container>
        <div className="py-10">
          <h1 className="text-3xl font-semibold mb-5">Strategies</h1>
          <FilterBar onChange={handleFilterChange} />
          {isLoading ? (
            <div>Loading strategies...</div>
          ) : isError ? (
            <div>Error loading strategies.</div>
          ) : (
            <StrategyList strategies={strategies || []} />
          )}
        </div>
      </Container>
    </div>
  );
};

export default Strategies;
