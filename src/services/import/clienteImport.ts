import { supabase } from "@/lib/supabase";

export interface ClienteImportado {
  nome: string;
  emails: Set<string>;
  telefones: Set<string>;
}

export async function importCliente(cliente: ClienteImportado): Promise<boolean> {
  try {
    const { data: clienteData, error: clienteError } = await supabase
      .from("clientes")
      .insert({ nome: cliente.nome })
      .select()
      .single();

    if (clienteError) {
      console.error(`Error inserting client ${cliente.nome}:`, clienteError);
      return false;
    }

    if (cliente.emails.size > 0) {
      const { error: emailsError } = await supabase
        .from("emails")
        .insert(
          Array.from(cliente.emails).map(email => ({
            id_cliente: clienteData.id_cliente,
            email
          }))
        );
      if (emailsError) {
        console.error(`Error inserting emails for client ${cliente.nome}:`, emailsError);
      }
    }

    if (cliente.telefones.size > 0) {
      const { error: telefonesError } = await supabase
        .from("telefones")
        .insert(
          Array.from(cliente.telefones).map(telefone => ({
            id_cliente: clienteData.id_cliente,
            telefone
          }))
        );
      if (telefonesError) {
        console.error(`Error inserting phones for client ${cliente.nome}:`, telefonesError);
      }
    }

    return true;
  } catch (error) {
    console.error("Error processing cliente:", cliente, error);
    return false;
  }
}

export function parseCSVContent(text: string): Map<string, ClienteImportado> {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const clientesMap = new Map<string, ClienteImportado>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(/,|;/).map(field => {
      const cleaned = field.trim().replace(/^["']|["']$/g, '');
      return cleaned.replace(/;/g, '');
    });

    const [nome, email, telefone] = values;
    if (!nome) continue;

    if (clientesMap.has(nome)) {
      const cliente = clientesMap.get(nome)!;
      if (email) cliente.emails.add(email);
      if (telefone) cliente.telefones.add(telefone);
    } else {
      clientesMap.set(nome, {
        nome,
        emails: new Set(email ? [email] : []),
        telefones: new Set(telefone ? [telefone] : [])
      });
    }
  }

  return clientesMap;
}