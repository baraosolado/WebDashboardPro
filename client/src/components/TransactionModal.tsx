import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertTransactionSchema, TransactionWithCategory, Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Extend schema with validation
const formSchema = insertTransactionSchema.extend({
  date: z.string().min(1, "A data é obrigatória"),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionWithCategory | null;
}

export default function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(transaction?.type || 'expense');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get categories for the form
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    enabled: isOpen
  });
  
  // Filter categories based on active tab
  const filteredCategories = categories?.filter(cat => cat.type === activeTab) || [];
  
  // Set up form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction?.description || '',
      amount: transaction?.amount ? transaction.amount.toString() : '',
      date: transaction?.date ? new Date(transaction.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
      type: transaction?.type || activeTab,
      categoryId: transaction?.categoryId ? transaction.categoryId.toString() : '',
      notes: transaction?.notes || '',
    }
  });
  
  // Update form values when transaction changes
  useEffect(() => {
    if (transaction) {
      setActiveTab(transaction.type);
      form.reset({
        description: transaction.description,
        amount: transaction.amount.toString(),
        date: new Date(transaction.date).toISOString().substring(0, 10),
        type: transaction.type,
        categoryId: transaction.categoryId.toString(),
        notes: transaction.notes || '',
      });
    } else {
      form.reset({
        description: '',
        amount: '',
        date: new Date().toISOString().substring(0, 10),
        type: activeTab,
        categoryId: '',
        notes: '',
      });
    }
  }, [transaction, form, activeTab]);
  
  // Switch tab handler
  const handleTabChange = (value: string) => {
    const newType = value as 'expense' | 'income';
    setActiveTab(newType);
    form.setValue('type', newType);
    form.setValue('categoryId', ''); // Reset category when switching tabs
  };
  
  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Convert form values to API format
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        categoryId: parseInt(data.categoryId)
      };
      
      const response = await apiRequest('POST', '/api/transactions', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transação criada com sucesso",
        description: "A transação foi adicionada ao sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary/trends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar transação",
        description: error.message || "Não foi possível criar a transação. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!transaction) throw new Error("Transaction not found");
      
      // Convert form values to API format
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        categoryId: parseInt(data.categoryId)
      };
      
      const response = await apiRequest('PUT', `/api/transactions/${transaction.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transação atualizada com sucesso",
        description: "A transação foi atualizada no sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary/trends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar transação",
        description: error.message || "Não foi possível atualizar a transação. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  // Form submission handler
  const onSubmit = (values: FormValues) => {
    if (transaction) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
          <DialogDescription>
            {transaction ? 'Altere os detalhes da transação abaixo.' : 'Preencha os detalhes da nova transação.'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-2">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="expense">Despesa</TabsTrigger>
            <TabsTrigger value="income">Receita</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Supermercado, Aluguel..." {...field} />
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
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      {...field} 
                    />
                  </FormControl>
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
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notas adicionais (opcional)" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {transaction ? 'Atualizar' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
