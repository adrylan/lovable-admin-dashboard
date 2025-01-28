import { supabase } from "@/lib/supabase";

export interface ImportacaoRecord {
  id_importacao: number;
  user_id: string;
}

export async function createImportRecord(fileName: string, userId: string): Promise<ImportacaoRecord> {
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

export async function updateImportProgress(
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