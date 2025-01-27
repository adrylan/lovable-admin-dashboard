import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UploadForm } from "./upload/UploadForm";
import { UploadProgress } from "./upload/UploadProgress";
import { useCSVImport } from "@/hooks/useCSVImport";

export function ImportCSV({ onImportComplete }: { onImportComplete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { file, setFile, isUploading, progress, handleUpload } = useCSVImport(() => {
    setIsOpen(false);
    onImportComplete();
  });

  const handleFileChange = (selectedFile: File | null) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
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
          />
          {isUploading && <UploadProgress progress={progress} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}