import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type UserRole = 'admin' | 'user' | 'user2' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRole(null);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar role:', error);
          setRole(null);
          return;
        }

        setRole(data?.role as UserRole);
      } catch (error) {
        console.error('Erro ao buscar role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  const canModifyData = role === 'admin' || role === 'user2';
  const isAdmin = role === 'admin';

  return { role, loading, canModifyData, isAdmin };
}