import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { processCSVImport } from "@/services/importService";

export function useCSVImport(onSuccess: () => void) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setProgress(10);

      const { imported, errors } = await processCSVImport(file, setProgress);

      toast({
        title: "Importação concluída",
        description: `${imported} registros importados, ${errors} erros`,
      });
      onSuccess();
    } catch (error) {
      console.error("Error during import:", error);
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
    handleUpload
  };
}