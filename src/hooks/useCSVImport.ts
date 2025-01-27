import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { processCSVImport } from "@/services/importService";

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
      setIsUploading(true);
      setError(null);
      setProgress(0);

      const { imported, errors } = await processCSVImport(file, (progress) => {
        console.log('Upload progress:', progress);
        setProgress(progress);
      });
      
      console.log('Import completed:', { imported, errors });

      toast({
        title: "Importação concluída",
        description: `${imported} registros importados, ${errors} erros`,
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error during import:", error);
      setError("Ocorreu um erro ao tentar importar o arquivo. Por favor, tente novamente.");
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao tentar importar o arquivo.",
        variant: "destructive",
      });
    } finally {
      console.log("Import process finished");
      setIsUploading(false);
      setFile(null);
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