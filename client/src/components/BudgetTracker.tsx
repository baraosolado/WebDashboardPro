import { useQuery } from "@tanstack/react-query";
import { BudgetWithCategory } from "@shared/schema";
import { formatCurrency, formatPercentage, getProgressBarColor } from "@/lib/formats";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetTracker() {
  const { data: budgets, isLoading } = useQuery<BudgetWithCategory[]>({
    queryKey: ['/api/budgets']
  });
  
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h2 className="text-xl font-bold text-[#607D8B]">Controle de Orçamento</h2>
        <Button className="bg-[#2196F3] hover:bg-[#1976D2]">
          Editar Orçamentos
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {budgets && budgets.length > 0 ? (
            budgets.map((budget) => {
              const percentage = (budget.spent / budget.amount) * 100;
              const progressColor = getProgressBarColor(percentage);
              
              return (
                <div key={budget.id} className="mb-4">
                  <div className="flex justify-between mb-1">
                    <div className="font-medium">{budget.category.name}</div>
                    <div className="text-sm">
                      <span className="font-medium">{formatCurrency(budget.spent)}</span>
                      {' / '}
                      {formatCurrency(budget.amount)}
                      {' '}
                      <span className="text-xs text-gray-500">
                        ({formatPercentage(percentage)})
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${progressColor} rounded-full`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-gray-500">
              Nenhum orçamento configurado.
            </div>
          )}
        </>
      )}
    </div>
  );
}
