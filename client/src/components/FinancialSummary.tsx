import { TransactionSummary } from "@shared/schema";
import { formatCurrency } from "@/lib/formats";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialSummaryProps {
  summary?: TransactionSummary;
  isLoading: boolean;
}

export default function FinancialSummary({ summary, isLoading }: FinancialSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {/* Balance Card */}
      <div className="bg-white rounded-lg p-5 shadow border-t-4 border-[#2196F3] text-center">
        <h3 className="text-[#607D8B] font-medium">Saldo Total</h3>
        {isLoading ? (
          <Skeleton className="h-10 w-32 mx-auto my-2" />
        ) : (
          <div className="text-3xl font-bold text-[#2196F3] my-2">
            {summary ? formatCurrency(summary.balance) : formatCurrency(0)}
          </div>
        )}
        <p className="text-sm text-gray-500">Atualizado hoje</p>
      </div>
      
      {/* Income Card */}
      <div className="bg-white rounded-lg p-5 shadow border-t-4 border-[#4CAF50] text-center">
        <h3 className="text-[#607D8B] font-medium">Receitas</h3>
        {isLoading ? (
          <Skeleton className="h-10 w-32 mx-auto my-2" />
        ) : (
          <div className="text-3xl font-bold text-[#4CAF50] my-2">
            {summary ? formatCurrency(summary.income) : formatCurrency(0)}
          </div>
        )}
        <p className="text-sm text-gray-500">Este mês</p>
      </div>
      
      {/* Expense Card */}
      <div className="bg-white rounded-lg p-5 shadow border-t-4 border-[#f44336] text-center">
        <h3 className="text-[#607D8B] font-medium">Despesas</h3>
        {isLoading ? (
          <Skeleton className="h-10 w-32 mx-auto my-2" />
        ) : (
          <div className="text-3xl font-bold text-[#f44336] my-2">
            {summary ? formatCurrency(summary.expense) : formatCurrency(0)}
          </div>
        )}
        <p className="text-sm text-gray-500">Este mês</p>
      </div>
    </div>
  );
}
