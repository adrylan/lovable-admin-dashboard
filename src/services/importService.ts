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
    
    // Configurar o reader para ler o arquivo como texto com codificação ISO-8859-1
    reader.onload = async (event) => {
      try {
        // Converter o texto do arquivo para UTF-8
        const decoder = new TextDecoder('iso-8859-1');
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const csvContent = decoder.decode(arrayBuffer);
        
        // Dividir por quebras de linha e filtrar linhas vazias
        const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
        
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

          // Se o cliente já existe no mapa, adiciona os contatos
          if (clientesMap.has(nome)) {
            const cliente = clientesMap.get(nome)!;
            if (email) cliente.emails.add(email);
            if (telefone) cliente.telefones.add(telefone);
          } else {
            // Se não existe, cria um novo registro
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

    // Ler o arquivo como ArrayBuffer para poder tratar a codificação
    reader.readAsArrayBuffer(file);
  });
}