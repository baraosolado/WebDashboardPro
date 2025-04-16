import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MonthlyTrend } from "@shared/schema";
import { Chart, ChartConfiguration, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from "chart.js";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formats";

// Register required Chart.js components
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

export default function TrendChart() {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const { data: trendData, isLoading } = useQuery<MonthlyTrend[]>({
    queryKey: ['/api/summary/trends']
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
    if (!chartRef.current || !trendData || isLoading) return;
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;
    
    const labels = trendData.map(item => item.month);
    const incomeData = trendData.map(item => item.income);
    const expenseData = trendData.map(item => item.expense);
    
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: incomeData,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Despesas',
            data: expenseData,
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return `${context.dataset.label}: ${formatCurrency(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value as number);
              }
            }
          }
        }
      }
    };
    
    chartInstance.current = new Chart(ctx, config);
  }, [trendData, isLoading]);
  
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="mb-4 pb-2 border-b">
        <h2 className="text-xl font-bold text-[#607D8B]">Tendência Mensal</h2>
      </div>
      <div className="h-64">
        {isLoading ? (
          <div className="flex flex-col space-y-2 h-full justify-center">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          trendData && trendData.length > 0 ? (
            <canvas ref={chartRef} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Sem dados de tendência para exibir.
            </div>
          )
        )}
      </div>
    </div>
  );
}
