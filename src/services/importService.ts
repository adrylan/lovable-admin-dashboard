import { supabase } from "@/lib/supabase";

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
        const csvContent = event.target?.result as string;
        // Dividir por quebras de linha e filtrar linhas vazias
        const lines = csvContent.split("\n").filter(line => line.trim());
        const total = lines.length - 1; // Excluding header
        let imported = 0;
        let errors = 0;

        // Update total records
        await supabase
          .from("importacoes")
          .update({ total_registros: total })
          .eq("id_importacao", importacao.id_importacao);

        onProgress(80);

        // Process each line
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Processar a linha considerando possíveis aspas e ponto e vírgula
          const values = line.split(/,|;/).map(field => {
            // Remover aspas e espaços extras
            const cleaned = field.trim().replace(/^["']|["']$/g, '');
            // Remover ponto e vírgula extras
            return cleaned.replace(/;/g, '');
          });

          const [nome, email, telefone] = values;

          try {
            // Insert cliente
            const { data: cliente, error: clienteError } = await supabase
              .from("clientes")
              .insert({ nome })
              .select()
              .single();

            if (clienteError) throw clienteError;

            // Insert email if provided
            if (email) {
              await supabase
                .from("emails")
                .insert({ id_cliente: cliente.id_cliente, email });
            }

            // Insert telefone if provided
            if (telefone) {
              await supabase
                .from("telefones")
                .insert({ id_cliente: cliente.id_cliente, telefone });
            }

            imported++;
          } catch (error) {
            console.error("Error processing line:", line, error);
            errors++;
          }

          // Update progress
          await supabase
            .from("importacoes")
            .update({
              registros_importados: imported,
              registros_com_erro: errors,
              status: i === lines.length - 1 ? "concluido" : "processando",
            })
            .eq("id_importacao", importacao.id_importacao);
        }

        onProgress(100);
        resolve({ imported, errors });
      } catch (error) {
        reject(error);
      }
    };

    reader.readAsText(file);
  });
}