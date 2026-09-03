import type { StatusPedido } from '@divine/shared';

export const ORDEM_STATUS: StatusPedido[] = ['recebido', 'producao', 'pronto', 'entregue'];

export const ETAPAS: { id: StatusPedido; rotulo: string }[] = [
  { id: 'recebido', rotulo: 'Recebido' },
  { id: 'producao', rotulo: 'Em produção' },
  { id: 'pronto', rotulo: 'Pronto' },
  { id: 'entregue', rotulo: 'Entregue' },
];
