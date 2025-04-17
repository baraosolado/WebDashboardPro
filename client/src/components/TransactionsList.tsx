import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { TransactionWithCategory } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/formats";
import { CATEGORY_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import TransactionModal from "@/components/TransactionModal";
import { Plus } from "lucide-react";

export default function TransactionsList() {
  const [, navigate] = useLocation();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionWithCategory | null>(null);
  
  const { data: transactions, isLoading } = useQuery<TransactionWithCategory[]>({
    queryKey: ['/api/transactions/recent']
  });
  
  const handleAddNew = () => {
    setCurrentTransaction(null);
    setShowTransactionModal(true);
  };
  
  const goToTransactions = () => {
    navigate("/transactions");
  };
  
  return (
    <>
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="text-xl font-bold text-[#607D8B]">Transações Recentes</h2>
          <Button onClick={handleAddNew} className="bg-[#4CAF50] hover:bg-[#43a047]">
            + Nova
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 text-[#607D8B]">Data</th>
                  <th className="text-left py-3 px-4 text-[#607D8B]">Descrição</th>
                  <th className="text-left py-3 px-4 text-[#607D8B]">Categoria</th>
                  <th className="text-left py-3 px-4 text-[#607D8B]">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions && transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{formatDate(transaction.date)}</td>
                      <td className="py-3 px-4">{transaction.description}</td>
                      <td className="py-3 px-4">
                        {transaction.category ? (
                          <span 
                            className="inline-block px-3 py-1 rounded-full text-xs font-medium" 
                            style={{
                              backgroundColor: CATEGORY_COLORS[transaction.category.color]?.bg || '#9E9E9E',
                              color: CATEGORY_COLORS[transaction.category.color]?.text || 'white'
                            }}
                          >
                            {transaction.category.name}
                          </span>
                        ) : (
                          <span 
                            className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700"
                          >
                            Sem categoria
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 ${transaction.type === 'expense' ? 'text-[#f44336]' : 'text-[#4CAF50]'}`}>
                        {transaction.type === 'expense' ? '- ' : '+ '}
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="mt-4 text-right">
          <Button variant="link" className="text-[#2196F3]" onClick={goToTransactions}>
            Ver todas as transações
          </Button>
        </div>
      </div>
      
      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transactionId={currentTransaction?.id}
      />
    </>
  );
}
