import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { processCSVImport } from "@/services/importService";
import { supabase } from "@/lib/supabase";

export function useCSVImport(onSuccess: () => void) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const resetState = () => {
    console.log("Resetting import state");
    setFile(null);
    setIsUploading(false);
    setProgress(0);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      console.log("No file selected for upload");
      return;
    }

    try {
      console.log("Starting file upload:", file.name);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("Sessão não encontrada");
        throw new Error("Sua sessão expirou. Por favor, faça login novamente.");
      }

      setIsUploading(true);
      setError(null);
      setProgress(0);

      if (file.type !== "text/csv") {
        throw new Error("Por favor, selecione um arquivo CSV válido.");
      }

      console.log("Processing CSV file...");
      const { imported, errors } = await processCSVImport(file, (progress) => {
        console.log('Upload progress:', progress);
        setProgress(progress);
      });
      
      console.log('Import completed:', { imported, errors });

      // Importante: resetar o estado antes de chamar onSuccess
      resetState();
      
      toast({
        title: "Importação concluída",
        description: `${imported} registros importados, ${errors} erros`,
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error during import:", error);
      const errorMessage = error.message || "Ocorreu um erro ao tentar importar o arquivo.";
      setError(errorMessage);
      toast({
        title: "Erro na importação",
        description: errorMessage,
        variant: "destructive",
      });
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    file,
    setFile,
    isUploading,
    progress,
    error,
    handleUpload,
    resetState
  };
}