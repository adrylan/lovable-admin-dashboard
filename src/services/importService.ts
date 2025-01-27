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

    onProgress(20);
    console.log("Import record created");

    // Upload file to storage
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("csv-imports")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      throw uploadError;
    }

    onProgress(40);
    console.log("File uploaded to storage");

    // Process the file
    return new Promise<{ imported: number; errors: number }>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          console.log("Starting file processing");
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          
          onProgress(60);
          
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

          onProgress(80);
          console.log(`Processing ${clientesMap.size} unique clients`);

          const total = clientesMap.size;
          let imported = 0;
          let errors = 0;

          // Update total records
          await supabase
            .from("importacoes")
            .update({ total_registros: total })
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
                throw clienteError;
              }

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
                if (emailsError) {
                  console.error(`Error inserting emails for client ${cliente.nome}:`, emailsError);
                  throw emailsError;
                }
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
                if (telefonesError) {
                  console.error(`Error inserting phones for client ${cliente.nome}:`, telefonesError);
                  throw telefonesError;
                }
              }

              imported++;
              console.log(`Successfully imported client ${cliente.nome}`);
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