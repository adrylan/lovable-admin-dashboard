import { supabase } from "@/lib/supabase";
import type { Cliente } from "@/types";
import { useToast } from "@/components/ui/use-toast";

interface UseClienteSaveProps {
  clienteInicial?: Cliente & {
    emails?: { email: string }[];
    telefones?: { telefone: string }[];
  };
  onSuccess: () => void;
}

export function useClienteSave({ clienteInicial, onSuccess }: UseClienteSaveProps) {
  const { toast } = useToast();

  const saveCliente = async (nome: string, emails: string[], telefones: string[]) => {
    try {
      if (clienteInicial) {
        // Atualizar cliente existente
        const { error: clienteError } = await supabase
          .from("clientes")
          .update({ nome })
          .eq("id_cliente", clienteInicial.id_cliente);

        if (clienteError) throw clienteError;

        // Deletar emails e telefones existentes
        await supabase
          .from("emails")
          .delete()
          .eq("id_cliente", clienteInicial.id_cliente);

        await supabase
          .from("telefones")
          .delete()
          .eq("id_cliente", clienteInicial.id_cliente);

        // Inserir novos emails
        const emailsToInsert = emails.filter((email) => email.trim() !== "");
        if (emailsToInsert.length > 0) {
          const { error: emailsError } = await supabase
            .from("emails")
            .insert(
              emailsToInsert.map((email) => ({
                id_cliente: clienteInicial.id_cliente,
                email,
              }))
            );
          if (emailsError) throw emailsError;
        }

        // Inserir novos telefones
        const telefonesToInsert = telefones.filter((tel) => tel.trim() !== "");
        if (telefonesToInsert.length > 0) {
          const { error: telefonesError } = await supabase
            .from("telefones")
            .insert(
              telefonesToInsert.map((telefone) => ({
                id_cliente: clienteInicial.id_cliente,
                telefone,
              }))
            );
          if (telefonesError) throw telefonesError;
        }

        toast({
          title: "Cliente atualizado com sucesso!",
        });
      } else {
        // Inserir novo cliente
        const { data: clienteData, error: clienteError } = await supabase
          .from("clientes")
          .insert([{ nome }])
          .select()
          .single();

        if (clienteError) throw clienteError;

        // Inserir emails
        const emailsToInsert = emails.filter((email) => email.trim() !== "");
        if (emailsToInsert.length > 0) {
          const { error: emailsError } = await supabase
            .from("emails")
            .insert(
              emailsToInsert.map((email) => ({
                id_cliente: clienteData.id_cliente,
                email,
              }))
            );
          if (emailsError) throw emailsError;
        }

        // Inserir telefones
        const telefonesToInsert = telefones.filter((tel) => tel.trim() !== "");
        if (telefonesToInsert.length > 0) {
          const { error: telefonesError } = await supabase
            .from("telefones")
            .insert(
              telefonesToInsert.map((telefone) => ({
                id_cliente: clienteData.id_cliente,
                telefone,
              }))
            );
          if (telefonesError) throw telefonesError;
        }

        toast({
          title: "Cliente cadastrado com sucesso!",
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        title: clienteInicial ? "Erro ao atualizar cliente" : "Erro ao cadastrar cliente",
        description: "Ocorreu um erro ao tentar salvar os dados do cliente.",
        variant: "destructive",
      });
    }
  };

  return { saveCliente };
}