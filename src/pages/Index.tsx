import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { Cliente } from '@/types';
import { useUserRole } from '@/hooks/useUserRole';
import { ClientList } from '@/components/clients/ClientList';
import { ClientHeader } from '@/components/clients/ClientHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClienteForm } from '@/components/ClienteForm';

interface ClienteComDetalhes extends Cliente {
  emails: { email: string }[];
  telefones: { telefone: string }[];
}

export default function Index() {
  const [clientes, setClientes] = useState<ClienteComDetalhes[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clienteParaEditar, setClienteParaEditar] = useState<ClienteComDetalhes | null>(null);
  const { toast } = useToast();
  const { canModifyData, loading: roleLoading } = useUserRole();

  const loadClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          *,
          emails (email),
          telefones (telefone)
        `)
        .ilike('nome', `%${search}%`)
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: 'Erro ao carregar clientes',
        description: 'Não foi possível carregar a lista de clientes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, [search]);

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id_cliente', id);

      if (error) throw error;
      
      toast({
        title: 'Cliente excluído',
        description: 'O cliente foi excluído com sucesso.',
      });
      
      loadClientes();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: 'Erro ao excluir cliente',
        description: 'Não foi possível excluir o cliente.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (cliente: Cliente & { emails?: { email: string }[]; telefones?: { telefone: string }[] }) => {
    setClienteParaEditar({
      ...cliente,
      emails: cliente.emails || [],
      telefones: cliente.telefones || []
    });
  };

  if (loading || roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          Carregando...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ClientHeader
          search={search}
          onSearchChange={setSearch}
          canModifyData={canModifyData}
          onClientAdded={loadClientes}
        />
        <ClientList
          clientes={clientes}
          canModifyData={canModifyData}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
        <Dialog open={!!clienteParaEditar} onOpenChange={(open) => !open && setClienteParaEditar(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            {clienteParaEditar && (
              <ClienteForm
                clienteInicial={clienteParaEditar}
                onSuccess={() => {
                  setClienteParaEditar(null);
                  loadClientes();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}