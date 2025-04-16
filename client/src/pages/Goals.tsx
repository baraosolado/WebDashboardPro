import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formats";

// Dados de exemplo para metas - em uma implementação real, isso viria do backend
const SAMPLE_GOALS = [
  {
    id: "g1",
    name: "Viagem Férias",
    targetAmount: 5000,
    currentAmount: 2500,
    deadline: "Dezembro/2025"
  },
  {
    id: "g2",
    name: "Notebook Novo",
    targetAmount: 4000,
    currentAmount: 3800,
    deadline: "Maio/2025"
  }
];

export default function Goals() {
  const [goals] = useState(SAMPLE_GOALS);

  // Calcular a porcentagem alcançada da meta
  const calculatePercentage = (current: number, target: number) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  // Determinar a cor da barra de progresso baseado na porcentagem
  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return "bg-green-500"; // Início da jornada
    if (percentage < 90) return "bg-amber-500"; // Bem encaminhado
    return "bg-red-500"; // Quase lá (vermelho como destaque, não como algo negativo)
  };

  return (
    <main className="max-w-7xl mx-auto p-4 pt-20">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold mb-1">Metas Financeiras</h1>
        <p className="text-gray-600 mb-6">Defina e acompanhe seus objetivos de economia.</p>

        {/* Lista de Metas */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-700">Minhas Metas</h2>
            <Button variant="default">+ Nova Meta</Button>
          </div>
          
          <div className="p-4">
            {goals.length === 0 ? (
              <div className="text-center p-8 text-gray-500">Você ainda não possui metas financeiras. Crie uma meta para começar a acompanhar.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal) => {
                  const percentage = calculatePercentage(goal.currentAmount, goal.targetAmount);
                  
                  return (
                    <div key={goal.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{goal.name}</h3>
                        <div className="text-sm text-gray-500">Meta: {formatCurrency(goal.targetAmount)}</div>
                      </div>
                      
                      <div className="mb-1">
                        {formatCurrency(goal.currentAmount)} ({percentage}%)
                      </div>
                      
                      <div className="h-2 w-full bg-gray-200 rounded-full mb-2">
                        <div 
                          className={`h-full rounded-full ${getProgressColor(percentage)}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-3">Prazo: {goal.deadline}</div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="success" className="h-8 text-xs">Adicionar Valor</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs">Editar</Button>
                        <Button size="sm" variant="destructive" className="h-8 text-xs">Excluir</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}