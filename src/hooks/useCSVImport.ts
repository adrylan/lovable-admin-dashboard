import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { processCSVImport } from "@/services/importService";

export function useCSVImport(onSuccess: () => void) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      setProgress(10);

      const { imported, errors } = await processCSVImport(file, (progress) => {
        setProgress(progress);
      });

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
    handleUpload
  };
}