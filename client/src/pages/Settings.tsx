import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

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

  // Buscar categorias
  const { data: categories, isLoading } = useQuery({
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

  // Mutação para salvar alterações de perfil (simulada)
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
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

  // Mutação para adicionar categoria (simulada)
  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id: Math.random().toString(), name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setNewCategory("");
      toast({
        title: "Categoria adicionada",
        description: "A categoria foi adicionada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar categoria",
        description: "Não foi possível adicionar a categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir categoria (simulada)
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir categoria",
        description: "Não foi possível excluir a categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategoryMutation.mutate(newCategory);
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
          <h2 className="text-lg font-semibold text-green-600 mb-4 pb-2 border-b">Gerenciar Categorias</h2>
          
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
              {categories.map((category: any) => (
                <li key={category.id} className="flex justify-between items-center p-3 border-b last:border-b-0">
                  <span>{category.name}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={deleteCategoryMutation.isPending}
                  >
                    Excluir
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Outras Configurações */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-green-600 mb-4 pb-2 border-b">Outras Configurações</h2>
          <p className="text-gray-500">Opções como moeda padrão, notificações, etc., podem ser adicionadas aqui.</p>
        </div>
      </div>
    </main>
  );
}