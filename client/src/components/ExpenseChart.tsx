import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CategorySummary } from "@shared/schema";
import { Chart, ChartConfiguration, DoughnutController, ArcElement, Tooltip, Legend } from "chart.js";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/formats";

// Register required Chart.js components
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

export default function ExpenseChart() {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const { data: expenseSummary, isLoading } = useQuery<CategorySummary[]>({
    queryKey: ['/api/summary/categories/expense']
  });
  
  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    if (!chartRef.current || !expenseSummary || isLoading) return;
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;
    
    const labels = expenseSummary.map(item => item.categoryName);
    const data = expenseSummary.map(item => item.amount);
    
    // Create a color array that matches the data length
    const colors = expenseSummary.map((_, index) => 
      CHART_COLORS[index % CHART_COLORS.length]
    );
    
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 20,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return `${context.label}: ${formatCurrency(value)}`;
              }
            }
          }
        }
      }
    };
    
    chartInstance.current = new Chart(ctx, config);
  }, [expenseSummary, isLoading]);
  
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="mb-4 pb-2 border-b">
        <h2 className="text-xl font-bold text-[#607D8B]">Distribuição de Despesas</h2>
      </div>
      <div className="h-64">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        ) : (
          expenseSummary && expenseSummary.length > 0 ? (
            <canvas ref={chartRef} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Sem dados de despesas para exibir.
            </div>
          )
        )}
      </div>
    </div>
  );
}
