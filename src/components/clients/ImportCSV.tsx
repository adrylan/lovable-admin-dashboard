import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UploadForm } from "./upload/UploadForm";
import { UploadProgress } from "./upload/UploadProgress";
import { useCSVImport } from "@/hooks/useCSVImport";
import { supabase } from "@/lib/supabase";

export function ImportCSV({ onImportComplete }: { onImportComplete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { file, setFile, isUploading, progress, handleUpload, error, resetState } = useCSVImport(() => {
    console.log("Import completed, closing dialog");
    setIsOpen(false);
    onImportComplete();
  });

  const handleFileChange = async (selectedFile: File | null) => {
    console.log("File selected:", selectedFile?.name);
    
    // Verificar sessão antes de prosseguir
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("Sessão não encontrada");
      toast({
        title: "Erro de sessão",
        description: "Sua sessão expirou. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile && selectedFile.type !== "text/csv") {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      });
      return;
    }
    setFile(selectedFile);
  };

  const handleClose = () => {
    console.log("Dialog closing, isUploading:", isUploading);
    if (!isUploading) {
      resetState();
      setIsOpen(false);
    }
  };

  const handleOpen = async () => {
    console.log("Opening import dialog");
    
    // Verificar sessão antes de abrir o diálogo
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("Sessão não encontrada");
      toast({
        title: "Erro de sessão",
        description: "Sua sessão expirou. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    resetState();
    setIsOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={handleOpen}>
          <Upload className="mr-2 h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Clientes via CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <UploadForm
            file={file}
            isUploading={isUploading}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
            error={error}
          />
          {isUploading && <UploadProgress progress={progress} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}