import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClienteForm } from '@/components/ClienteForm';
import { useState } from 'react';

interface ClientHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  canModifyData: boolean;
  onClientAdded: () => void;
}

export function ClientHeader({ search, onSearchChange, canModifyData, onClientAdded }: ClientHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <Input
        placeholder="Buscar clientes..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      {canModifyData && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            <ClienteForm onSuccess={() => {
              setDialogOpen(false);
              onClientAdded();
            }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}