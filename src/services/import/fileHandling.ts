import { supabase } from "@/lib/supabase";

export async function uploadFileToStorage(file: File, userId: string): Promise<string> {
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

export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file, 'ISO-8859-1');
  });
}