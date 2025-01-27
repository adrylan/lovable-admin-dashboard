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
    setFile(null);
    setIsUploading(false);
    setProgress(0);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      console.log('Iniciando importação do arquivo:', file.name);
      
      const { imported, errors } = await processCSVImport(file, (progress) => {
        console.log('Progresso da importação:', progress);
        setProgress(progress);
      });
      
      console.log('Importação concluída:', { imported, errors });

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
    handleUpload,
    resetState
  };
}