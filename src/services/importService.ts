import { supabase } from "@/lib/supabase";

interface ClienteImportado {
  nome: string;
  emails: Set<string>;
  telefones: Set<string>;
}

export async function processCSVImport(file: File, onProgress: (progress: number) => void) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Create import record
  const { data: importacao, error: importError } = await supabase
    .from("importacoes")
    .insert({
      nome_arquivo: file.name,
      status: "processando",
      user_id: user.id
    })
    .select()
    .single();

  if (importError) throw importError;

  onProgress(30);

  // Upload file to storage
  const filePath = `${user.id}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("csv-imports")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  onProgress(60);

  // Process the file
  return new Promise<{ imported: number; errors: number }>((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        // Mapa para agrupar clientes por nome
        const clientesMap = new Map<string, ClienteImportado>();
        
        // Processar cada linha e agrupar por nome
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

        const total = clientesMap.size;
        let imported = 0;
        let errors = 0;

        // Update total records
        await supabase
          .from("importacoes")
          .update({ total_registros: total })
          .eq("id_importacao", importacao.id_importacao);

        onProgress(80);

        // Importar clientes agrupados
        for (const cliente of clientesMap.values()) {
          try {
            // Insert cliente
            const { data: clienteData, error: clienteError } = await supabase
              .from("clientes")
              .insert({ nome: cliente.nome })
              .select()
              .single();

            if (clienteError) throw clienteError;

            // Insert emails
            const emailsArray = Array.from(cliente.emails);
            if (emailsArray.length > 0) {
              const { error: emailsError } = await supabase
                .from("emails")
                .insert(
                  emailsArray.map(email => ({
                    id_cliente: clienteData.id_cliente,
                    email
                  }))
                );
              if (emailsError) throw emailsError;
            }

            // Insert telefones
            const telefonesArray = Array.from(cliente.telefones);
            if (telefonesArray.length > 0) {
              const { error: telefonesError } = await supabase
                .from("telefones")
                .insert(
                  telefonesArray.map(telefone => ({
                    id_cliente: clienteData.id_cliente,
                    telefone
                  }))
                );
              if (telefonesError) throw telefonesError;
            }

            imported++;
          } catch (error) {
            console.error("Error processing cliente:", cliente, error);
            errors++;
          }

          // Update progress
          await supabase
            .from("importacoes")
            .update({
              registros_importados: imported,
              registros_com_erro: errors,
              status: imported + errors === total ? "concluido" : "processando",
            })
            .eq("id_importacao", importacao.id_importacao);
        }

        onProgress(100);
        resolve({ imported, errors });
      } catch (error) {
        reject(error);
      }
    };

    reader.readAsText(file, 'ISO-8859-1');
  });
}