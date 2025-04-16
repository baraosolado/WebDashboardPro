import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formats";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Reports() {
  const [showReport, setShowReport] = useState(false);

  // Buscar dados para o relatório (tendências mensais)
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["/api/summary/trends"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: showReport,
  });

  // Buscar resumo das categorias de despesas
  const { data: expensesByCategory, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/summary/categories/expense"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: showReport,
  });

  // Buscar resumo financeiro
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/summary"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: showReport,
  });

  const handleGenerateReport = () => {
    setShowReport(true);
  };

  const isLoading = trendsLoading || categoriesLoading || summaryLoading;

  return (
    <main className="max-w-7xl mx-auto p-4 pt-20">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold mb-1">Relatórios</h1>
        <p className="text-gray-600 mb-6">Analise suas finanças com mais detalhes.</p>

        {/* Gerador de Relatório */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-700">Gerar Relatório Financeiro</h2>
          </div>
          
          <div className="p-4">
            <Button variant="default" onClick={handleGenerateReport}>
              Gerar Relatório
            </Button>

            {showReport && (
              <div className="mt-6">
                {isLoading ? (
                  <div className="text-center p-8 text-gray-500">Carregando dados do relatório...</div>
                ) : (
                  <div className="space-y-8">
                    {/* Resumo financeiro */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Resumo Financeiro</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg border-t-4 border-green-500">
                          <div className="text-sm text-gray-500">Receitas</div>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(summary?.income || 0)}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border-t-4 border-red-500">
                          <div className="text-sm text-gray-500">Despesas</div>
                          <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(summary?.expense || 0)}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border-t-4 border-blue-500">
                          <div className="text-sm text-gray-500">Saldo</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(summary?.balance || 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gráfico de tendências mensais */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Tendências Mensais</h3>
                      <div className="bg-gray-50 p-4 rounded-lg" style={{ height: "400px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={trends || []}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                            <Legend />
                            <Bar dataKey="income" name="Receitas" fill="#4CAF50" />
                            <Bar dataKey="expense" name="Despesas" fill="#f44336" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Despesas por categoria */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Despesas por Categoria</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Categoria
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Valor
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Porcentagem
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {expensesByCategory?.map((item) => (
                              <tr key={item.categoryId}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2"
                                      style={{ backgroundColor: item.categoryColor }}
                                    ></div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.categoryName}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                  {item.percentage?.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Botão para imprimir relatório (apenas visual) */}
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => window.print()}>
                        Imprimir Relatório
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}