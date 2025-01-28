import { supabase } from "@/lib/supabase";

interface ClienteImportado {
  nome: string;
  emails: Set<string>;
  telefones: Set<string>;
}

export async function processCSVImport(file: File, onProgress: (progress: number) => void) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("User not authenticated");
    throw new Error("Usuário não autenticado");
  }

  try {
    console.log("Starting CSV import process");
    
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

    if (importError) {
      console.error("Error creating import record:", importError);
      throw importError;
    }

    onProgress(10);
    console.log("Import record created, ID:", importacao.id_importacao);

    // Upload file to storage
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("csv-imports")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      throw uploadError;
    }

    onProgress(30);
    console.log("File uploaded to storage:", filePath);

    // Process the file
    return new Promise<{ imported: number; errors: number }>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          console.log("Starting file content processing");
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          
          onProgress(40);
          console.log(`Processing ${lines.length} lines from CSV`);
          
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
            
            if (!nome) {
              console.log(`Skipping line ${i + 1}: Empty name`);
              continue;
            }

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

            // Atualizar progresso periodicamente
            if (i % 10 === 0) {
              const progress = Math.floor(40 + (i / lines.length) * 30);
              onProgress(progress);
            }
          }

          onProgress(70);
          console.log(`Processed ${clientesMap.size} unique clients`);

          let imported = 0;
          let errors = 0;

          // Update total records
          await supabase
            .from("importacoes")
            .update({ total_registros: clientesMap.size })
            .eq("id_importacao", importacao.id_importacao);

          // Importar clientes agrupados
          for (const cliente of clientesMap.values()) {
            try {
              console.log(`Importing client: ${cliente.nome}`);
              
              // Insert cliente
              const { data: clienteData, error: clienteError } = await supabase
                .from("clientes")
                .insert({ nome: cliente.nome })
                .select()
                .single();

              if (clienteError) {
                console.error(`Error inserting client ${cliente.nome}:`, clienteError);
                errors++;
                continue;
              }

              // Insert emails
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

              // Insert telefones
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

              imported++;
              console.log(`Successfully imported client ${cliente.nome}`);

              // Atualizar progresso periodicamente
              const progress = Math.floor(70 + (imported / clientesMap.size) * 30);
              onProgress(progress);

              // Update import progress
              await supabase
                .from("importacoes")
                .update({
                  registros_importados: imported,
                  registros_com_erro: errors,
                  status: imported + errors === clientesMap.size ? "concluido" : "processando",
                })
                .eq("id_importacao", importacao.id_importacao);

            } catch (error) {
              console.error("Error processing cliente:", cliente, error);
              errors++;
            }
          }

          onProgress(100);
          console.log("Import process completed", { imported, errors });
          resolve({ imported, errors });
        } catch (error) {
          console.error("Error processing CSV:", error);
          reject(error);
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        reject(error);
      };

      reader.readAsText(file, 'ISO-8859-1');
    });
  } catch (error) {
    console.error("Error in processCSVImport:", error);
    throw error;
  }
}