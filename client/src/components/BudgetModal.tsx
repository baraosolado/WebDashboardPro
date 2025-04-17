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
import { Category } from "@shared/schema";

// Schema para validação do formulário
const budgetSchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  categoryId: z.coerce.number(),
  period: z.string().min(1, "Período é obrigatório"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId?: number | null;
}

export default function BudgetModal({ isOpen, onClose, budgetId }: BudgetModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Buscar categorias de despesas
  const { data: categories } = useQuery({
    queryKey: ["/api/categories/expense"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Buscar orçamento se estiver editando
  const { data: budget, isLoading: isLoadingBudget } = useQuery({
    queryKey: ["/api/budgets", budgetId],
    queryFn: budgetId ? getQueryFn({ on401: "throw" }) : () => null,
    enabled: !!budgetId,
  });

  // Configuração do formulário
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: 0,
      categoryId: 0,
      period: "mensal",
    },
  });

  // Atualizar formulário quando carregar o orçamento
  useEffect(() => {
    if (budget) {
      form.reset({
        amount: budget.amount,
        categoryId: budget.categoryId,
        period: budget.period,
      });
    } else {
      form.reset({
        amount: 0,
        categoryId: 0,
        period: "mensal",
      });
    }
  }, [budget, form]);

  // Mutação para criar orçamento
  const createMutation = useMutation({
    mutationFn: async (data: BudgetFormValues) => {
      const response = await apiRequest("POST", "/api/budgets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Orçamento criado",
        description: "O orçamento foi criado com sucesso.",
      });
      onClose();
      
      // Enviar para webhook
      sendToWebhook("create", form.getValues());
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar orçamento",
        description: "Não foi possível criar o orçamento. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao criar orçamento:", error);
    },
  });

  // Mutação para atualizar orçamento
  const updateMutation = useMutation({
    mutationFn: async (data: BudgetFormValues) => {
      const response = await apiRequest("PUT", `/api/budgets/${budgetId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets", budgetId] });
      toast({
        title: "Orçamento atualizado",
        description: "O orçamento foi atualizado com sucesso.",
      });
      onClose();
      
      // Enviar para webhook
      sendToWebhook("update", form.getValues(), budgetId);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar orçamento",
        description: "Não foi possível atualizar o orçamento. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao atualizar orçamento:", error);
    },
  });

  // Mutação para excluir orçamento
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/budgets/${budgetId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Orçamento excluído",
        description: "O orçamento foi excluído com sucesso.",
      });
      onClose();
      
      // Enviar para webhook
      sendToWebhook("delete", form.getValues(), budgetId);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir orçamento",
        description: "Não foi possível excluir o orçamento. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao excluir orçamento:", error);
    },
  });

  // Função para enviar dados para o webhook (com flag fromApp)
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
          entityType: "budget",
          entityId: id || "new",
          data,
          timestamp: new Date().toISOString(),
          // Flag para indicar que a entidade já está sendo salva no banco pelo sistema
          fromApp: true
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar para webhook:", error);
    }
  };

  const onSubmit = (values: BudgetFormValues) => {
    if (budgetId) {
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
            {budgetId ? "Editar Orçamento" : "Novo Orçamento"}
          </DialogTitle>
          <DialogDescription>
            {budgetId ? "Edite as informações do orçamento abaixo." : "Preencha o formulário para criar um novo orçamento."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingBudget && budgetId ? (
          <div className="flex justify-center p-6">Carregando orçamento...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Limite</FormLabel>
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
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                {budgetId && (
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
                    {isPending ? "Salvando..." : budgetId ? "Atualizar" : "Criar"}
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