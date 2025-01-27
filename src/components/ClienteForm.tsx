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
import { useState, useEffect } from "react";
import type { Cliente } from "@/types";
import { EmailField } from "./clients/EmailField";
import { TelefoneField } from "./clients/TelefoneField";
import { useClienteSave } from "@/hooks/useClienteSave";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

interface ClienteFormProps {
  onSuccess: () => void;
  clienteInicial?: Cliente & {
    emails?: { email: string }[];
    telefones?: { telefone: string }[];
  };
}

export function ClienteForm({ onSuccess, clienteInicial }: ClienteFormProps) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [telefones, setTelefones] = useState<string[]>([""]);
  const { saveCliente } = useClienteSave({ clienteInicial, onSuccess });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: clienteInicial?.nome || "",
    },
  });

  useEffect(() => {
    if (clienteInicial) {
      const emailsIniciais = clienteInicial.emails?.map(e => e.email) || [""];
      const telefonesIniciais = clienteInicial.telefones?.map(t => t.telefone) || [""];
      setEmails(emailsIniciais);
      setTelefones(telefonesIniciais);
    }
  }, [clienteInicial]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await saveCliente(values.nome, emails, telefones);
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

        <EmailField emails={emails} setEmails={setEmails} />
        <TelefoneField telefones={telefones} setTelefones={setTelefones} />

        <Button type="submit" className="w-full">
          {clienteInicial ? "Atualizar Cliente" : "Cadastrar Cliente"}
        </Button>
      </form>
    </Form>
  );
}