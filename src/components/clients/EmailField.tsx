import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

interface EmailFieldProps {
  emails: string[];
  setEmails: (emails: string[]) => void;
}

export function EmailField({ emails, setEmails }: EmailFieldProps) {
  return (
    <div className="space-y-4">
      <FormLabel>E-mails</FormLabel>
      {emails.map((email, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => {
              const newEmails = [...emails];
              newEmails[index] = e.target.value;
              setEmails(newEmails);
            }}
            placeholder="email@exemplo.com"
          />
          {emails.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setEmails(emails.filter((_, i) => i !== index));
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
        onClick={() => setEmails([...emails, ""])}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar e-mail
      </Button>
    </div>
  );
}