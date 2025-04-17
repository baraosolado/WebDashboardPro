import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Category } from "@shared/schema";
import CategoryModal from "@/components/CategoryModal";
import AppearanceSettings from "@/components/AppearanceSettings";

// Schema para validação do perfil
const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Settings() {
  const { username } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newCategory, setNewCategory] = useState("");
  
  // Estados para gerenciar o modal de categoria
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Buscar categorias
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Form para edição de perfil
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: username || "",
      email: "usuario@exemplo.com", // Em uma app real, isso viria do banco de dados
      password: "",
    },
  });

  // Mutação para salvar alterações de perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar perfil",
        description: "Não foi possível atualizar suas informações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutação para adicionar categoria
  const addCategoryMutation = useMutation({
    mutationFn: async (data: { name: string, type: string, color: string }) => {
      const response = await apiRequest("POST", "/api/categories", data);
      const result = await response.json();
      
      // Enviar para webhook
      await sendToWebhook("create", { ...data, id: "new" });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setNewCategory("");
      toast({
        title: "Categoria adicionada",
        description: "A categoria foi adicionada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar categoria",
        description: "Não foi possível adicionar a categoria. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao adicionar categoria:", error);
    },
  });

  // Mutação para excluir categoria
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const category = categories?.find((c: Category) => c.id === id);
      const response = await apiRequest("DELETE", `/api/categories/${id}`);
      
      // Enviar para webhook
      if (category) {
        await sendToWebhook("delete", category, id);
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
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
          entityType: "category",
          entityId: id || "new",
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar para webhook:", error);
    }
  };

  // Funções para gerenciar o modal
  const openNewCategoryModal = () => {
    setSelectedCategoryId(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setIsCategoryModalOpen(true);
  };

  const closeModal = () => {
    setIsCategoryModalOpen(false);
    setSelectedCategoryId(null);
  };

  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategoryMutation.mutate({
        name: newCategory,
        type: "expense", // Valor padrão
        color: "green", // Valor padrão
      });
    }
  };

  const handleDeleteCategory = (id: number) => {
    deleteCategoryMutation.mutate(id);
  };

  return (
    <main className="max-w-7xl mx-auto p-4 pt-20">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold mb-1">Configurações</h1>
        <p className="text-gray-600 mb-6">Gerencie suas preferências e categorias.</p>

        {/* Perfil do Usuário */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-600 mb-4 pb-2 border-b">Perfil do Usuário</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha (deixe em branco para não alterar)</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Gerenciar Categorias */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h2 className="text-lg font-semibold text-green-600">Gerenciar Categorias</h2>
            <Button 
              variant="default"
              onClick={openNewCategoryModal}
            >
              + Nova Categoria
            </Button>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nome da nova categoria"
              className="flex-1"
            />
            <Button 
              onClick={handleAddCategory}
              disabled={!newCategory.trim() || addCategoryMutation.isPending}
            >
              Adicionar
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center p-4 text-gray-500">Carregando categorias...</div>
          ) : !categories || categories.length === 0 ? (
            <div className="text-center p-4 text-gray-500">Nenhuma categoria encontrada.</div>
          ) : (
            <ul className="border rounded-md max-h-72 overflow-y-auto">
              {categories.map((category: Category) => (
                <li key={category.id} className="flex justify-between items-center p-3 border-b last:border-b-0">
                  <div className="flex items-center">
                    <span 
                      className={`inline-block w-3 h-3 rounded-full mr-3 bg-${category.color}-500`}
                    />
                    <span>{category.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({category.type === 'income' ? 'Receita' : 'Despesa'})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditCategoryModal(category.id)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      Excluir
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Personalização do Aplicativo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-green-600 mb-4 pb-2 border-b">Personalização do Aplicativo</h2>
          <AppearanceSettings />
        </div>
      </div>
      
      {/* Modal de Categoria */}
      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={closeModal}
        categoryId={selectedCategoryId}
      />
    </main>
  );
}