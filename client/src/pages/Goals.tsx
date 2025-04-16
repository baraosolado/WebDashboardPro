import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formats";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import GoalModal from "@/components/GoalModal";

// Definindo a interface para os tipos de metas
interface Goal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | Date;
  description?: string | null;
}

export default function Goals() {
  // Estados para gerenciar modais
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  // Buscar metas do backend
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["/api/goals"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

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
  
  // Formatar data
  const formatDeadline = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };
  
  // Funções para gerenciar modais
  const openNewGoalModal = () => {
    setSelectedGoalId(null);
    setIsAddFundsModalOpen(false);
    setIsGoalModalOpen(true);
  };
  
  const openEditGoalModal = (goalId: number) => {
    setSelectedGoalId(goalId);
    setIsAddFundsModalOpen(false);
    setIsGoalModalOpen(true);
  };
  
  const openAddFundsModal = (goalId: number) => {
    setSelectedGoalId(goalId);
    setIsGoalModalOpen(false);
    setIsAddFundsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsGoalModalOpen(false);
    setIsAddFundsModalOpen(false);
    setSelectedGoalId(null);
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
            <Button 
              variant="default"
              onClick={openNewGoalModal}
            >
              + Nova Meta
            </Button>
          </div>
          
          <div className="p-4">
            {isLoading ? (
              <div className="text-center p-8 text-gray-500">Carregando metas...</div>
            ) : goals.length === 0 ? (
              <div className="text-center p-8 text-gray-500">Você ainda não possui metas financeiras. Crie uma meta para começar a acompanhar.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal: Goal) => {
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
                      
                      <div className="text-sm text-gray-500 mb-3">
                        Prazo: {formatDeadline(goal.targetDate)}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="success" 
                          className="h-8 text-xs"
                          onClick={() => openAddFundsModal(goal.id)}
                        >
                          Adicionar Valor
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs"
                          onClick={() => openEditGoalModal(goal.id)}
                        >
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="h-8 text-xs"
                          onClick={() => openEditGoalModal(goal.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modais */}
      <GoalModal 
        isOpen={isGoalModalOpen}
        onClose={closeModal}
        goalId={selectedGoalId}
      />
      
      <GoalModal 
        isOpen={isAddFundsModalOpen}
        onClose={closeModal}
        goalId={selectedGoalId}
        isAddFunds={true}
      />
    </main>
  );
}