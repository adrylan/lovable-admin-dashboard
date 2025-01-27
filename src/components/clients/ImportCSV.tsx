import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export function ImportCSV({ onImportComplete }: { onImportComplete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setProgress(10);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Create import record
      const { data: importacao, error: importError } = await supabase
        .from("importacoes")
        .insert({
          nome_arquivo: file.name,
          status: "processando",
          user_id: user.id
        })
        .select()
        .single();

      if (importError) throw importError;

      setProgress(30);

      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("csv-imports")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setProgress(60);

      // Process the file
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csvContent = event.target?.result as string;
        const lines = csvContent.split("\n").filter(line => line.trim());
        const total = lines.length - 1; // Excluding header
        let imported = 0;
        let errors = 0;

        // Update total records
        await supabase
          .from("importacoes")
          .update({ total_registros: total })
          .eq("id_importacao", importacao.id_importacao);

        setProgress(80);

        // Process each line
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const [nome, email, telefone] = line.split(",").map(field => field.trim());

          try {
            // Insert cliente
            const { data: cliente, error: clienteError } = await supabase
              .from("clientes")
              .insert({ nome })
              .select()
              .single();

            if (clienteError) throw clienteError;

            // Insert email if provided
            if (email) {
              await supabase
                .from("emails")
                .insert({ id_cliente: cliente.id_cliente, email });
            }

            // Insert telefone if provided
            if (telefone) {
              await supabase
                .from("telefones")
                .insert({ id_cliente: cliente.id_cliente, telefone });
            }

            imported++;
          } catch (error) {
            console.error("Error processing line:", line, error);
            errors++;
          }

          // Update progress
          await supabase
            .from("importacoes")
            .update({
              registros_importados: imported,
              registros_com_erro: errors,
              status: i === lines.length - 1 ? "concluido" : "processando",
            })
            .eq("id_importacao", importacao.id_importacao);
        }

        setProgress(100);
        toast({
          title: "Importação concluída",
          description: `${imported} registros importados, ${errors} erros`,
        });
        onImportComplete();
        setIsOpen(false);
      };

      reader.readAsText(file);
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
          {!file && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">
                  Clique para selecionar um arquivo CSV
                </span>
              </label>
            </div>
          )}

          {file && (
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-gray-500">
                Importando... {progress}%
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? "Importando..." : "Iniciar Importação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}