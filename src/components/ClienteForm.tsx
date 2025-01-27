import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

export function ClienteForm({ onSuccess }: { onSuccess: () => void }) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [telefones, setTelefones] = useState<string[]>([""]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Insert cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from("clientes")
        .insert([{ nome: values.nome }])
        .select()
        .single();

      if (clienteError) throw clienteError;

      // Insert emails
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

      // Insert telefones
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
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro ao cadastrar cliente",
        description: "Ocorreu um erro ao tentar cadastrar o cliente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
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

        <div className="space-y-4">
          <FormLabel>E-mails</FormLabel>
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => {
                  const newEmails = [...emails];
                  newEmails[index] = e.target.value;
                  setEmails(newEmails);
                }}
                placeholder="email@exemplo.com"
              />
              {emails.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEmails(emails.filter((_, i) => i !== index));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setEmails([...emails, ""])}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar e-mail
          </Button>
        </div>

        <div className="space-y-4">
          <FormLabel>Telefones</FormLabel>
          {telefones.map((telefone, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={telefone}
                onChange={(e) => {
                  const newTelefones = [...telefones];
                  newTelefones[index] = e.target.value;
                  setTelefones(newTelefones);
                }}
                placeholder="(00) 00000-0000"
              />
              {telefones.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setTelefones(telefones.filter((_, i) => i !== index));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setTelefones([...telefones, ""])}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar telefone
          </Button>
        </div>

        <Button type="submit" className="w-full">
          Cadastrar Cliente
        </Button>
      </form>
    </Form>
  );
}