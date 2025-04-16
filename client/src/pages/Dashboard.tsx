import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TransactionSummary } from "@shared/schema";
import FinancialSummary from "@/components/FinancialSummary";
import TransactionsList from "@/components/TransactionsList";
import BudgetTracker from "@/components/BudgetTracker";
import ExpenseChart from "@/components/ExpenseChart";
import TrendChart from "@/components/TrendChart";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("month");
  
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
  
  // Função para formatar o período atual com base na seleção
  const getPeriodText = () => {
    const now = new Date();
    
    switch(period) {
      case "day":
        return `Dia ${now.getDate()} de ${now.toLocaleDateString('pt-BR', { month: 'long' })} de ${now.getFullYear()}`;
      case "week":
        return `Semana atual (${now.toLocaleDateString('pt-BR')})`;
      case "year":
        return `Ano de ${now.getFullYear()}`;
      case "month":
      default:
        const month = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return month.charAt(0).toUpperCase() + month.slice(1);
    }
  };
  
  return (
    <main className="pt-24 px-4 pb-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Dashboard Financeiro</h1>
        <div className="flex justify-between items-center">
          <p className="text-[#607D8B]">Visão geral das suas finanças - {getPeriodText()}</p>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Diário</SelectItem>
              <SelectItem value="week">Semanal</SelectItem>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="year">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
    </main>
  );
}
