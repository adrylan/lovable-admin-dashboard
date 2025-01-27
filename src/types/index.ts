export interface Cliente {
  id_cliente: number;
  nome: string;
  created_at?: string;
}

export interface Email {
  id_email: number;
  id_cliente: number;
  email: string;
  created_at?: string;
}

export interface Telefone {
  id_telefone: number;
  id_cliente: number;
  telefone: string;
  created_at?: string;
}

export interface ClienteCompleto extends Cliente {
  emails: Email[];
  telefones: Telefone[];
}