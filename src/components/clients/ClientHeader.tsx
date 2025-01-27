import { Button } from "@/components/ui/button";
import { ImportCSV } from "./ImportCSV";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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

interface ClientHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  canModifyData: boolean;
  onClientAdded: () => void;
}

export function ClientHeader({
  search,
  onSearchChange,
  canModifyData,
  onClientAdded,
}: ClientHeaderProps) {
  const { toast } = useToast();

  const handleDeleteAll = async () => {
    try {
      // Primeiro, excluir todos os emails
      const { error: emailsError } = await supabase
        .from('emails')
        .delete()
        .neq('id_email', 0);
      
      if (emailsError) throw emailsError;

      // Em seguida, excluir todos os telefones
      const { error: telefonesError } = await supabase
        .from('telefones')
        .delete()
        .neq('id_telefone', 0);
      
      if (telefonesError) throw telefonesError;

      // Por fim, excluir todos os clientes
      const { error: clientesError } = await supabase
        .from('clientes')
        .delete()
        .neq('id_cliente', 0);
      
      if (clientesError) throw clientesError;

      toast({
        title: "Registros excluídos com sucesso",
        description: "Todos os registros foram removidos do sistema.",
      });

      // Atualizar a lista de clientes
      onClientAdded();
    } catch (error) {
      console.error('Erro ao excluir registros:', error);
      toast({
        title: "Erro ao excluir registros",
        description: "Ocorreu um erro ao tentar excluir os registros.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      {canModifyData && (
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                Excluir Todos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir todos os registros? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ImportCSV onImportComplete={onClientAdded} />
        </div>
      )}
    </div>
  );
}