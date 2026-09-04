import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CriarPedido, pedidoSchema } from '@divine/shared';
import type { z } from 'zod';
import { apiFetch } from './client';
import { chaves } from './queries';

/** O mesmo schema que a API publica — criação e leitura devolvem este formato. */
export type PedidoApi = z.infer<typeof pedidoSchema>;

export function useMeusPedidos() {
  return useQuery({
    queryKey: chaves.meusPedidos,
    queryFn: () => apiFetch<PedidoApi[]>('/api/pedidos'),
    // O status anda pelas mãos da confeiteira, não pelas do cliente: cache
    // curto, para que abrir a aba mostre o andamento de agora.
    staleTime: 30 * 1000,
  });
}

export function usePedido(id: string) {
  return useQuery({
    queryKey: chaves.pedido(id),
    queryFn: () => apiFetch<PedidoApi>(`/api/pedidos/${id}`),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useCriarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: CriarPedido) =>
      apiFetch<PedidoApi>('/api/pedidos', { method: 'POST', body: JSON.stringify(dados) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      // A agenda também: este pedido pode ter sido o que lotou o dia, e o
      // calendário do próximo pedido precisa refletir isso.
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
    },
  });
}
