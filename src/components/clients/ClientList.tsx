import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Cliente } from '@/types';
import { useState } from 'react';

interface ClientListProps {
  clientes: Array<Cliente & {
    emails: { email: string }[];
    telefones: { telefone: string }[];
  }>;
  canModifyData: boolean;
  onDelete: (id: number) => Promise<void>;
  onEdit: (cliente: Cliente) => void;
}

export function ClientList({ clientes, canModifyData, onDelete, onEdit }: ClientListProps) {
  const [clienteToDelete, setClienteToDelete] = useState<number | null>(null);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mails</TableHead>
            <TableHead>Telefones</TableHead>
            {canModifyData && <TableHead>Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canModifyData ? 4 : 3} className="text-center">
                Nenhum cliente encontrado
              </TableCell>
            </TableRow>
          ) : (
            clientes.map((cliente) => (
              <TableRow key={cliente.id_cliente}>
                <TableCell className="font-medium">{cliente.nome}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {cliente.emails?.map((email, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {email.email}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {cliente.telefones?.map((telefone, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {telefone.telefone}
                      </div>
                    ))}
                  </div>
                </TableCell>
                {canModifyData && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(cliente)}
                      >
                        Editar
                      </Button>
                      <AlertDialog open={clienteToDelete === cliente.id_cliente} onOpenChange={(open) => !open && setClienteToDelete(null)}>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setClienteToDelete(cliente.id_cliente)}
                        >
                          Excluir
                        </Button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(cliente.id_cliente)}>
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}