import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TransactionWithCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionWithCategory | null;
}

export default function DeleteConfirmModal({ isOpen, onClose, transaction }: DeleteConfirmModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!transaction) throw new Error("Transaction not found");
      
      await apiRequest('DELETE', `/api/transactions/${transaction.id}`);
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
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir transação",
        description: error.message || "Não foi possível excluir a transação. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  const handleDelete = () => {
    deleteMutation.mutate();
  };
  
  if (!transaction) return null;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a transação "{transaction.description}"? 
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-[#f44336] hover:bg-[#d32f2f]"
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
