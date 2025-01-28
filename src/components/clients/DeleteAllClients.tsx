import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface DeleteAllClientsProps {
  onDeleteSuccess: () => void;
}

export function DeleteAllClients({ onDeleteSuccess }: DeleteAllClientsProps) {
  const { toast } = useToast();
  const [showSecondConfirmation, setShowSecondConfirmation] = useState(false);

  const handleDeleteAll = async () => {
    try {
      console.log("Iniciando processo de exclusão em massa");
      
      // Verificar sessão antes de prosseguir
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("Sessão não encontrada");
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }

      // Primeiro, excluir todos os emails
      const { error: emailsError } = await supabase
        .from('emails')
        .delete()
        .neq('id_email', 0);
      
      if (emailsError) {
        console.error("Erro ao excluir emails:", emailsError);
        throw emailsError;
      }

      // Em seguida, excluir todos os telefones
      const { error: telefonesError } = await supabase
        .from('telefones')
        .delete()
        .neq('id_telefone', 0);
      
      if (telefonesError) {
        console.error("Erro ao excluir telefones:", telefonesError);
        throw telefonesError;
      }

      // Por fim, excluir todos os clientes
      const { error: clientesError } = await supabase
        .from('clientes')
        .delete()
        .neq('id_cliente', 0);
      
      if (clientesError) {
        console.error("Erro ao excluir clientes:", clientesError);
        throw clientesError;
      }

      console.log("Exclusão em massa concluída com sucesso");
      toast({
        title: "Registros excluídos com sucesso",
        description: "Todos os registros foram removidos do sistema.",
      });

      onDeleteSuccess();
      setShowSecondConfirmation(false);
    } catch (error: any) {
      console.error('Erro ao excluir registros:', error);
      toast({
        title: "Erro ao excluir registros",
        description: error.message || "Ocorreu um erro ao tentar excluir os registros.",
        variant: "destructive",
      });
      setShowSecondConfirmation(false);
    }
  };

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            Excluir Todos
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Primeira confirmação de exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir todos os registros do sistema. Esta ação requer confirmação dupla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSecondConfirmation(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowSecondConfirmation(true)}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showSecondConfirmation && (
        <AlertDialog open={showSecondConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmação final de exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                ATENÇÃO: Esta é a confirmação final. Ao confirmar, todos os registros serão permanentemente excluídos. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowSecondConfirmation(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAll}>
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}