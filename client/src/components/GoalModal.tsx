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
import { Textarea } from "@/components/ui/textarea";

// Schema para validação do formulário
const goalSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  targetAmount: z.coerce.number().positive("Valor deve ser positivo"),
  currentAmount: z.coerce.number().min(0, "Valor não pode ser negativo"),
  targetDate: z.string(),
  description: z.string().nullable().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

// Schema para adição de fundos
const addFundsSchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser positivo"),
});

type AddFundsFormValues = z.infer<typeof addFundsSchema>;

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId?: number | null;
  isAddFunds?: boolean;
}

export default function GoalModal({ isOpen, onClose, goalId, isAddFunds = false }: GoalModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Buscar meta se estiver editando ou adicionando fundos
  const { data: goal, isLoading: isLoadingGoal } = useQuery({
    queryKey: ["/api/goals", goalId],
    queryFn: goalId ? getQueryFn({ on401: "throw" }) : () => null,
    enabled: !!goalId,
  });

  // Configuração do formulário principal
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      targetDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().substring(0, 10),
      description: "",
    },
  });

  // Configuração do formulário de adição de fundos
  const addFundsForm = useForm<AddFundsFormValues>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: {
      amount: 0,
    },
  });

  // Atualizar formulário quando carregar a meta
  useEffect(() => {
    if (goal) {
      const targetDate = new Date(goal.targetDate).toISOString().substring(0, 10);
      
      form.reset({
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: targetDate,
        description: goal.description || "",
      });
    } else {
      form.reset({
        name: "",
        targetAmount: 0,
        currentAmount: 0,
        targetDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().substring(0, 10),
        description: "",
      });
    }
  }, [goal, form]);

  // Mutação para criar meta
  const createMutation = useMutation({
    mutationFn: async (data: GoalFormValues) => {
      const response = await apiRequest("POST", "/api/goals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Meta criada",
        description: "A meta foi criada com sucesso.",
      });
      onClose();
      
      // Enviar para webhook
      sendToWebhook("create", form.getValues());
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar meta",
        description: "Não foi possível criar a meta. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao criar meta:", error);
    },
  });

  // Mutação para atualizar meta
  const updateMutation = useMutation({
    mutationFn: async (data: GoalFormValues) => {
      const response = await apiRequest("PUT", `/api/goals/${goalId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals", goalId] });
      toast({
        title: "Meta atualizada",
        description: "A meta foi atualizada com sucesso.",
      });
      onClose();
      
      // Enviar para webhook
      sendToWebhook("update", form.getValues(), goalId);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar meta",
        description: "Não foi possível atualizar a meta. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao atualizar meta:", error);
    },
  });

  // Mutação para excluir meta
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/goals/${goalId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Meta excluída",
        description: "A meta foi excluída com sucesso.",
      });
      onClose();
      
      // Enviar para webhook
      sendToWebhook("delete", form.getValues(), goalId);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir meta",
        description: "Não foi possível excluir a meta. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao excluir meta:", error);
    },
  });

  // Mutação para adicionar fundos
  const addFundsMutation = useMutation({
    mutationFn: async (data: AddFundsFormValues) => {
      const response = await apiRequest("PUT", `/api/goals/${goalId}/add-funds`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals", goalId] });
      toast({
        title: "Fundos adicionados",
        description: "Os fundos foram adicionados com sucesso à meta.",
      });
      onClose();
      
      // Enviar para webhook
      sendToWebhook("add-funds", addFundsForm.getValues(), goalId);
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar fundos",
        description: "Não foi possível adicionar fundos à meta. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao adicionar fundos:", error);
    },
  });

  // Função para enviar dados para o webhook
  const sendToWebhook = async (
    action: "create" | "update" | "delete" | "add-funds", 
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
          entityType: "goal",
          entityId: id || "new",
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar para webhook:", error);
    }
  };

  const onSubmit = (values: GoalFormValues) => {
    if (goalId && !isAddFunds) {
      updateMutation.mutate(values);
    } else if (!isAddFunds) {
      createMutation.mutate(values);
    }
  };

  const onAddFundsSubmit = (values: AddFundsFormValues) => {
    if (goalId && isAddFunds) {
      addFundsMutation.mutate(values);
    }
  };

  const handleDeleteClick = () => {
    if (showConfirmDelete) {
      deleteMutation.mutate();
    } else {
      setShowConfirmDelete(true);
    }
  };

  const isPending = 
    createMutation.isPending || 
    updateMutation.isPending || 
    deleteMutation.isPending || 
    addFundsMutation.isPending;

  if (isAddFunds && goalId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Adicionar Fundos à Meta</DialogTitle>
            <DialogDescription>
              Informe o valor que deseja adicionar a esta meta.
            </DialogDescription>
          </DialogHeader>

          {isLoadingGoal ? (
            <div className="flex justify-center p-6">Carregando meta...</div>
          ) : (
            <div className="py-4">
              <div className="mb-4">
                <h3 className="font-medium">{goal?.name}</h3>
                <div className="text-sm text-gray-500 mt-1">
                  Progresso atual: {goal?.currentAmount} / {goal?.targetAmount}
                </div>
              </div>

              <Form {...addFundsForm}>
                <form onSubmit={addFundsForm.handleSubmit(onAddFundsSubmit)} className="space-y-4">
                  <FormField
                    control={addFundsForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor a adicionar</FormLabel>
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

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Adicionando..." : "Adicionar Fundos"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {goalId ? "Editar Meta" : "Nova Meta"}
          </DialogTitle>
          <DialogDescription>
            {goalId ? "Edite as informações da meta abaixo." : "Preencha o formulário para criar uma nova meta financeira."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingGoal && goalId ? (
          <div className="flex justify-center p-6">Carregando meta...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Comprar um carro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Alvo</FormLabel>
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
                name="currentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Atual</FormLabel>
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
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Alvo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                      <Textarea 
                        placeholder="Detalhes sobre esta meta (opcional)" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                {goalId && (
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
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Salvando..." : goalId ? "Atualizar" : "Criar"}
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