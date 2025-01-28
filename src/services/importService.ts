import { supabase } from "@/lib/supabase";
import { uploadFileToStorage, readFileContent } from "./import/fileHandling";
import { createImportRecord, updateImportProgress } from "./import/importRecord";
import { parseCSVContent, importCliente } from "./import/clienteImport";

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

    const text = await readFileContent(file);
    onProgress(40);
    
    const clientesMap = parseCSVContent(text);
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
    return { imported, errors };
  } catch (error) {
    console.error("Error in processCSVImport:", error);
    throw error;
  }
}