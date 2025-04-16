import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getQueryFn } from "@/lib/queryClient";
import { BudgetWithCategory } from "@shared/schema";

export default function Budgets() {
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // Formato YYYY-MM

  // Buscar orçamentos
  const { data: budgets, isLoading } = useQuery({
    queryKey: ["/api/budgets"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Calcular a cor da barra de progresso baseado na porcentagem
  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return "bg-green-500"; // Safe
    if (percentage < 90) return "bg-amber-500"; // Warning
    return "bg-red-500"; // Danger
  };

  // Formatar o mês selecionado para exibição
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <main className="max-w-7xl mx-auto p-4 pt-20">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold mb-1">Orçamentos</h1>
        <p className="text-gray-600 mb-6">Defina e acompanhe seus limites de gastos por categoria.</p>

        {/* Filtro de Mês */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mês/Ano</label>
              <Input 
                type="month" 
                value={month} 
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div>
              <Button variant="default" className="w-full md:w-auto">Ver Orçamento</Button>
            </div>
          </div>
        </div>

        {/* Lista de Orçamentos */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-700">
              Orçamentos para {formatMonth(month)}
            </h2>
            <Button variant="default">+ Novo Orçamento</Button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Carregando orçamentos...</div>
          ) : !budgets || budgets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum orçamento encontrado para este mês.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {budgets.map((budget: BudgetWithCategory) => {
                const percentage = Math.min(100, (budget.spent / budget.amount) * 100);
                
                return (
                  <div key={budget.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-baseline mb-2">
                        <span>
                          <span 
                            className={`inline-block px-2 py-1 rounded-full text-xs text-white font-semibold bg-${budget.category.color}-500`}
                          >
                            {budget.category.name}
                          </span>
                        </span>
                        <span className="text-sm">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                        </span>
                      </div>
                      
                      <div className="h-2 w-full bg-gray-200 rounded-full mb-2">
                        <div 
                          className={`h-full rounded-full ${getProgressColor(percentage)}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs">Editar</Button>
                        <Button variant="destructive" size="sm" className="h-8 text-xs">Excluir</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}