import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

interface TelefoneFieldProps {
  telefones: string[];
  setTelefones: (telefones: string[]) => void;
}

export function TelefoneField({ telefones, setTelefones }: TelefoneFieldProps) {
  return (
    <div className="space-y-4">
      <FormLabel>Telefones</FormLabel>
      {telefones.map((telefone, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={telefone}
            onChange={(e) => {
              const newTelefones = [...telefones];
              newTelefones[index] = e.target.value;
              setTelefones(newTelefones);
            }}
            placeholder="(00) 00000-0000"
          />
          {telefones.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setTelefones(telefones.filter((_, i) => i !== index));
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setTelefones([...telefones, ""])}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar telefone
      </Button>
    </div>
  );
}