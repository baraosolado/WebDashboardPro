import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/formats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Category, TransactionWithCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import TransactionModal from "@/components/TransactionModal";

export default function Transactions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  
  // Estados para controlar o modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  
  // Estados para o diálogo de confirmação de exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionWithCategory | null>(null);

  // Buscar todas as transações
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Buscar categorias para o filtro
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Mutação para excluir transação
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!transactionToDelete) throw new Error("Transaction not found");
      const response = await apiRequest('DELETE', `/api/transactions/${transactionToDelete.id}`);
      
      // Enviar para webhook
      try {
        await fetch("https://webhook.dev.solandox.com/webhook/fintrack", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "delete",
            entityType: "transaction",
            entityId: transactionToDelete.id,
            data: transactionToDelete,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error("Erro ao enviar para webhook:", error);
      }
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Transação excluída com sucesso",
        description: "A transação foi removida do sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary/trends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      setIsDeleteDialogOpen(false);
      setTransactionToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir transação",
        description: error.message || "Não foi possível excluir a transação. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Função para limpar filtros
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setType("all");
    setCategoryId("all");
  };

  // Funções para gerenciar o modal
  const openNewTransactionModal = () => {
    setSelectedTransactionId(null);
    setIsModalOpen(true);
  };

  const openEditTransactionModal = (transactionId: number) => {
    setSelectedTransactionId(transactionId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransactionId(null);
  };
  
  // Filtro de transações
  const filteredTransactions = transactions || [] as TransactionWithCategory[];
  
  // Função para aplicar filtros (no momento é simulada)
  const applyFilters = () => {
    // Os filtros já são aplicados automaticamente
    // Esta é apenas uma função para ação do botão
  };

  return (
    <main className="max-w-7xl mx-auto p-4 pt-20">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold mb-1">Transações</h1>
        <p className="text-gray-600 mb-6">Visualize e gerencie suas receitas e despesas.</p>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data Início</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data Fim</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Categoria</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories?.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>Limpar</Button>
            <Button variant="default" onClick={applyFilters}>Filtrar</Button>
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-700">Histórico Completo</h2>
            <Button variant="default" onClick={openNewTransactionModal}>+ Nova Transação</Button>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Carregando transações...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nenhuma transação encontrada.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Data</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Descrição</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Categoria</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Valor</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction: TransactionWithCategory) => (
                    <tr key={transaction.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">{formatDate(transaction.date)}</td>
                      <td className="py-3 px-4">{transaction.description}</td>
                      <td className="py-3 px-4">
                        {transaction.category ? (
                          <span 
                            className={`inline-block px-2 py-1 rounded-full text-xs text-white font-semibold bg-${transaction.category.color}-500`}
                          >
                            {transaction.category.name}
                          </span>
                        ) : (
                          <span 
                            className="inline-block px-2 py-1 rounded-full text-xs text-gray-700 font-semibold bg-gray-200"
                          >
                            Sem categoria
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="warning" 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => openEditTransactionModal(transaction.id)}
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => {
                              setTransactionToDelete(transaction);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de Transação */}
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        transactionId={selectedTransactionId}
      />
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a transação "{transactionToDelete?.description}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setTransactionToDelete(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}