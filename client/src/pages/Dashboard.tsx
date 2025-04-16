import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TransactionSummary } from "@shared/schema";
import FinancialSummary from "@/components/FinancialSummary";
import TransactionsList from "@/components/TransactionsList";
import BudgetTracker from "@/components/BudgetTracker";
import ExpenseChart from "@/components/ExpenseChart";
import TrendChart from "@/components/TrendChart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  
  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery<TransactionSummary>({
    queryKey: ['/api/summary']
  });
  
  useEffect(() => {
    if (summaryError) {
      toast({
        title: "Erro ao carregar resumo financeiro",
        description: "Não foi possível carregar os dados financeiros. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  }, [summaryError, toast]);
  
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
  
  return (
    <main className="pt-24 px-4 pb-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Dashboard Financeiro</h1>
        <p className="text-[#607D8B]">Visão geral das suas finanças - {capitalizedMonth}</p>
      </div>
      
      <FinancialSummary summary={summary} isLoading={isSummaryLoading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <TransactionsList />
        
        <div className="space-y-6">
          <BudgetTracker />
          <ExpenseChart />
          <TrendChart />
        </div>
      </div>
      
      {/* Floating Action Button */}
      <Button 
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#4CAF50] hover:bg-[#43a047] text-white flex items-center justify-center shadow-lg z-40"
        size="icon"
        aria-label="Adicionar nova transação"
      >
        <i className="fas fa-plus text-xl"></i>
      </Button>
    </main>
  );
}
