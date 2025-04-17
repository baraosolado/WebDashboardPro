import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Category } from "@shared/schema";

// Schema para validação do formulário
const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  categoryId: z.coerce.number(),
  date: z.string(),
  // Removido campo notes que não existe na tabela do Supabase
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId?: number | null;
}

export default function TransactionModal({ isOpen, onClose, transactionId }: TransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Buscar categorias
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Buscar transação se estiver editando
  const { data: transaction, isLoading: isLoadingTransaction } = useQuery({
    queryKey: ["/api/transactions", transactionId],
    queryFn: transactionId ? getQueryFn({ on401: "throw" }) : () => null,
    enabled: !!transactionId,
  });

  // Formatar data atual para formato YYYY-MM-DD
  const formatDateForInput = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Configuração do formulário
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      description: "",
      amount: 0,
      categoryId: 0,
      date: formatDateForInput(new Date()),
      // Removido campo notes pois não existe na tabela do Supabase
    },
  });

  // Atualizar formulário quando carregar a transação
  useEffect(() => {
    if (transaction) {
      try {
        const transactionDate = new Date(transaction.date);
        const formattedDate = formatDateForInput(transactionDate);
        
        form.reset({
          type: transaction.type,
          description: transaction.description,
          amount: transaction.amount,
          categoryId: transaction.categoryId,
          date: formattedDate,
          // Removido campo notes pois não existe na tabela do Supabase
        });
      } catch (error) {
        console.error("Erro ao formatar data da transação:", error);
        // Usar data atual como fallback
        form.reset({
          type: transaction.type,
          description: transaction.description,
          amount: transaction.amount,
          categoryId: transaction.categoryId,
          date: formatDateForInput(new Date()),
          // Removido campo notes pois não existe na tabela do Supabase
        });
      }
    } else {
      form.reset({
        type: "expense",
        description: "",
        amount: 0,
        categoryId: 0,
        date: formatDateForInput(new Date()),
        // Removido campo notes pois não existe na tabela do Supabase
      });
    }
  }, [transaction, form]);

  // Mutação para criar transação
  const createMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      // Primeiro enviar para webhook antes de criar no banco
      try {
        await sendToWebhook("create", data);
      } catch (error) {
        console.error("Erro ao enviar para webhook (não crítico):", error);
      }
      
      // Agora criar a transação no backend
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/categories/expense"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/trends"] });
      toast({
        title: "Transação criada",
        description: "A transação foi criada com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar transação",
        description: "Não foi possível criar a transação. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao criar transação:", error);
    },
  });

  // Mutação para atualizar transação
  const updateMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      // Primeiro enviar para webhook antes de atualizar no banco
      try {
        await sendToWebhook("update", data, transactionId);
      } catch (error) {
        console.error("Erro ao enviar para webhook (não crítico):", error);
      }
      
      // Agora atualizar a transação no backend
      const response = await apiRequest("PUT", `/api/transactions/${transactionId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/categories/expense"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/trends"] });
      toast({
        title: "Transação atualizada",
        description: "A transação foi atualizada com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar transação",
        description: "Não foi possível atualizar a transação. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao atualizar transação:", error);
    },
  });

  // Mutação para excluir transação
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/transactions/${transactionId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/categories/expense"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/trends"] });
      toast({
        title: "Transação excluída",
        description: "A transação foi excluída com sucesso.",
      });
      onClose();
      
      // Enviar para webhook
      sendToWebhook("delete", form.getValues(), transactionId);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir transação",
        description: "Não foi possível excluir a transação. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao excluir transação:", error);
    },
  });

  // Função para enviar dados para o webhook
  const sendToWebhook = async (
    action: "create" | "update" | "delete", 
    data: any, 
    id?: number | null
  ) => {
    try {
      await fetch("https://webhook.dev.solandox.com/webhook/fintrack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          entityType: "transaction",
          entityId: id || "new",
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar para webhook:", error);
    }
  };

  const onSubmit = (values: TransactionFormValues) => {
    if (transactionId) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDeleteClick = () => {
    if (showConfirmDelete) {
      deleteMutation.mutate();
    } else {
      setShowConfirmDelete(true);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // Modificado para prevenir duplicações: onOpenChange agora usa uma função que verifica se não está em processamento
  const handleOpenChange = (open: boolean) => {
    if (!open && !isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {transactionId ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
          <DialogDescription>
            {transactionId ? "Edite as informações da transação abaixo." : "Preencha o formulário para criar uma nova transação."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingTransaction && transactionId ? (
          <div className="flex justify-center p-6">Carregando transação...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">Despesa</SelectItem>
                        <SelectItem value="income">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Supermercado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category: Category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo de observações removido pois não existe na tabela do Supabase */}

              <DialogFooter className="gap-2 sm:gap-0">
                {transactionId && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteClick}
                    disabled={isPending}
                  >
                    {showConfirmDelete ? "Confirmar Exclusão" : "Excluir"}
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isPending) {
                        onClose();
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Salvando..." : transactionId ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}