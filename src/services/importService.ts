import { supabase } from "@/lib/supabase";

interface ClienteImportado {
  nome: string;
  emails: Set<string>;
  telefones: Set<string>;
}

interface ImportacaoRecord {
  id_importacao: number;
  user_id: string;
}

async function createImportRecord(fileName: string, userId: string): Promise<ImportacaoRecord> {
  const { data: importacao, error } = await supabase
    .from("importacoes")
    .insert({
      nome_arquivo: fileName,
      status: "processando",
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating import record:", error);
    throw error;
  }

  return importacao;
}

async function uploadFileToStorage(file: File, userId: string): Promise<string> {
  const filePath = `${userId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from("csv-imports")
    .upload(filePath, file);

  if (error) {
    console.error("Error uploading file:", error);
    throw error;
  }

  return filePath;
}

async function parseCSVContent(text: string): Promise<Map<string, ClienteImportado>> {
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

async function importCliente(cliente: ClienteImportado): Promise<boolean> {
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

async function updateImportProgress(
  importacaoId: number,
  imported: number,
  errors: number,
  total: number
): Promise<void> {
  await supabase
    .from("importacoes")
    .update({
      registros_importados: imported,
      registros_com_erro: errors,
      status: imported + errors === total ? "concluido" : "processando",
    })
    .eq("id_importacao", importacaoId);
}

export async function processCSVImport(
  file: File,
  onProgress: (progress: number) => void
): Promise<{ imported: number; errors: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("User not authenticated");
    throw new Error("Usuário não autenticado");
  }

  try {
    console.log("Starting CSV import process");
    onProgress(10);
    
    const importacao = await createImportRecord(file.name, user.id);
    console.log("Import record created, ID:", importacao.id_importacao);
    
    onProgress(30);
    await uploadFileToStorage(file, user.id);
    console.log("File uploaded to storage");

    return new Promise<{ imported: number; errors: number }>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          onProgress(40);
          
          const clientesMap = await parseCSVContent(text);
          console.log(`Processing ${clientesMap.size} unique clients`);
          
          await supabase
            .from("importacoes")
            .update({ total_registros: clientesMap.size })
            .eq("id_importacao", importacao.id_importacao);

          let imported = 0;
          let errors = 0;
          const total = clientesMap.size;
          
          for (const cliente of clientesMap.values()) {
            const success = await importCliente(cliente);
            if (success) {
              imported++;
              console.log(`Successfully imported client ${cliente.nome}`);
            } else {
              errors++;
            }

            const progress = Math.floor(40 + ((imported + errors) / total) * 60);
            onProgress(progress);
            
            await updateImportProgress(importacao.id_importacao, imported, errors, total);
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