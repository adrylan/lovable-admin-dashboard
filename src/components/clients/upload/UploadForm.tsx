import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadFormProps {
  file: File | null;
  isUploading: boolean;
  error?: string | null;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
}

export function UploadForm({ file, isUploading, error, onFileChange, onUpload }: UploadFormProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      onFileChange(selectedFile);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!file && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
            disabled={isUploading}
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
            onClick={() => onFileChange(null)}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Button
        onClick={onUpload}
        disabled={!file || isUploading}
        className="w-full"
      >
        {isUploading ? "Importando..." : "Iniciar Importação"}
      </Button>
    </div>
  );
}