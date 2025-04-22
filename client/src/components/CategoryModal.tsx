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

// Schema para validação do formulário
const categorySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  type: z.enum(["income", "expense"]),
  color: z.enum([
    "green", "blue", "purple", "orange", "pink", 
    "teal", "red", "yellow", "indigo", "gray"
  ]),
  // Campo icon removido pois não existe na tabela do Supabase
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: number | null;
}

export default function CategoryModal({ isOpen, onClose, categoryId }: CategoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Buscar categoria se estiver editando
  const { data: category, isLoading: isLoadingCategory } = useQuery({
    queryKey: ["/api/categories", categoryId],
    queryFn: categoryId ? getQueryFn({ on401: "throw" }) : () => null,
    enabled: !!categoryId,
  });

  // Configuração do formulário
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "expense",
      color: "green",
      // Campo icon removido pois não existe na tabela do Supabase
    },
  });

  // Atualizar formulário quando carregar a categoria
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        type: category.type,
        color: category.color,
        // Campo icon removido pois não existe na tabela do Supabase
      });
    } else {
      form.reset({
        name: "",
        type: "expense",
        color: "green",
        // Campo icon removido pois não existe na tabela do Supabase
      });
    }
  }, [category, form]);

  // Mutação para criar categoria
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      // Primeiro enviar para webhook antes de criar no banco
      try {
        await sendToWebhook("create", data);
      } catch (error) {
        console.error("Erro ao enviar para webhook (não crítico):", error);
      }
      
      // Depois criar a categoria no backend
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar categoria",
        description: "Não foi possível criar a categoria. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao criar categoria:", error);
    },
  });

  // Mutação para atualizar categoria
  const updateMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      // Primeiro enviar para webhook
      try {
        await sendToWebhook("update", data, categoryId);
      } catch (error) {
        console.error("Erro ao enviar para webhook (não crítico):", error);
      }
      
      // Depois atualizar a categoria no backend
      const response = await apiRequest("PUT", `/api/categories/${categoryId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", categoryId] });
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: "Não foi possível atualizar a categoria. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao atualizar categoria:", error);
    },
  });

  // Mutação para excluir categoria
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Salvar dados antes da exclusão para enviar ao webhook
      const categoryData = form.getValues();
      
      // Primeiro enviar para webhook antes de excluir
      try {
        await sendToWebhook("delete", categoryData, categoryId);
      } catch (error) {
        console.error("Erro ao enviar para webhook (não crítico):", error);
      }
      
      // Depois excluir a categoria do backend
      const response = await apiRequest("DELETE", `/api/categories/${categoryId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir categoria",
        description: "Não foi possível excluir a categoria. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao excluir categoria:", error);
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
          entityType: "category",
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

  const onSubmit = (values: CategoryFormValues) => {
    if (categoryId) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {categoryId ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {categoryId ? "Edite as informações da categoria abaixo." : "Preencha o formulário para criar uma nova categoria."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingCategory && categoryId ? (
          <div className="flex justify-center p-6">Carregando categoria...</div>
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
                      <Input placeholder="Ex: Alimentação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma cor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="green">Verde</SelectItem>
                        <SelectItem value="blue">Azul</SelectItem>
                        <SelectItem value="purple">Roxo</SelectItem>
                        <SelectItem value="orange">Laranja</SelectItem>
                        <SelectItem value="pink">Rosa</SelectItem>
                        <SelectItem value="teal">Turquesa</SelectItem>
                        <SelectItem value="red">Vermelho</SelectItem>
                        <SelectItem value="yellow">Amarelo</SelectItem>
                        <SelectItem value="indigo">Índigo</SelectItem>
                        <SelectItem value="gray">Cinza</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo de ícone removido pois não existe na tabela do Supabase */}

              <DialogFooter className="gap-2 sm:gap-0">
                {categoryId && (
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
                    {isPending ? "Salvando..." : categoryId ? "Atualizar" : "Criar"}
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