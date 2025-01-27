import { Button } from "@/components/ui/button";
import { ImportCSV } from "./ImportCSV";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { DeleteAllClients } from "./DeleteAllClients";

interface ClientHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  canModifyData: boolean;
  onClientAdded: () => void;
}

export function ClientHeader({
  search,
  onSearchChange,
  canModifyData,
  onClientAdded,
}: ClientHeaderProps) {
  const { isAdmin } = useUserRole();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      {canModifyData && (
        <div className="flex gap-2">
          {isAdmin && <DeleteAllClients onDeleteSuccess={onClientAdded} />}
          <ImportCSV onImportComplete={onClientAdded} />
        </div>
      )}
    </div>
  );
}