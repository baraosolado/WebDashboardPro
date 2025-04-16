import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { getQueryFn } from "@/lib/queryClient";
import { Category, Transaction, TransactionWithCategory } from "@shared/schema";

export default function Transactions() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Buscar todas as transações
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Buscar categorias para o filtro
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Função para limpar filtros
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setType("");
    setCategoryId("");
  };

  // Filtro de transações (simulado - em uma implementação real, enviaria ao backend)
  const filteredTransactions = transactions || [];

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
            <Button variant="default">Filtrar</Button>
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-700">Histórico Completo</h2>
            <Button variant="default">+ Nova Transação</Button>
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
                        <span 
                          className={`inline-block px-2 py-1 rounded-full text-xs text-white font-semibold bg-${transaction.category.color}-500`}
                        >
                          {transaction.category.name}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button variant="warning" size="sm" className="h-8 text-xs">Editar</Button>
                          <Button variant="destructive" size="sm" className="h-8 text-xs">Excluir</Button>
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
    </main>
  );
}