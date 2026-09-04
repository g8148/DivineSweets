import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { grupoOpcaoSchema, produtoAdminSchema, StatusPedido } from '@divine/shared';
import type { z } from 'zod';
import { apiFetch } from './client';
import type { PedidoApi } from './pedidos';
import type { ProdutoApi } from './produtos';
import { chaves } from './queries';

export type GrupoOpcao = z.infer<typeof grupoOpcaoSchema>;
export type ProdutoAdmin = z.infer<typeof produtoAdminSchema>;
export type Bloqueio = { data: string; motivo: string | null };

export function useAdminPedidos(status?: StatusPedido) {
  return useQuery({
    queryKey: chaves.adminPedidos(status),
    // O filtro é do servidor: a listagem cresce sem limite e trazer tudo para
    // filtrar no aparelho ficaria pesado justo no dia mais movimentado.
    queryFn: () => apiFetch<PedidoApi[]>(`/api/admin/pedidos${status ? `?status=${status}` : ''}`),
    staleTime: 15 * 1000,
  });
}

/**
 * A rota do cliente filtra pelo dono e responderia 404 para a administração —
 * que precisa justamente ver o pedido dos outros.
 */
export function useAdminPedido(id: string) {
  return useQuery({
    queryKey: ['admin', 'pedido', id],
    queryFn: () => apiFetch<PedidoApi>(`/api/admin/pedidos/${id}`),
    enabled: Boolean(id),
    staleTime: 15 * 1000,
  });
}

export function useAtualizarStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { id: string; status: StatusPedido; motivoRecusa?: string }) =>
      apiFetch<PedidoApi>(`/api/admin/pedidos/${v.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: v.status, motivoRecusa: v.motivoRecusa }),
      }),
    onSuccess: (pedido) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      // Recusar libera vaga na agenda daquele dia, e o cliente vê o pedido pela
      // sua própria rota — as duas árvores de cache precisam saber.
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.setQueryData(['admin', 'pedido', pedido.id], pedido);
    },
  });
}

/** Inclui os desativados — é a única listagem em que eles reaparecem. */
export function useAdminProdutos() {
  return useQuery({
    queryKey: chaves.adminProdutos,
    queryFn: () => apiFetch<ProdutoApi[]>('/api/admin/produtos'),
  });
}

export function useGruposDeOpcoes() {
  return useQuery({
    queryKey: ['admin', 'grupos'],
    queryFn: () => apiFetch<GrupoOpcao[]>('/api/admin/grupos'),
  });
}

function invalidarCatalogo(queryClient: ReturnType<typeof useQueryClient>) {
  // As duas: o catálogo público e a listagem administrativa são consultas
  // diferentes sobre a mesma tabela.
  queryClient.invalidateQueries({ queryKey: ['produtos'] });
  queryClient.invalidateQueries({ queryKey: chaves.adminProdutos });
}

export function useSalvarProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { id?: string; dados: Partial<ProdutoAdmin> }) =>
      apiFetch<ProdutoApi>(v.id ? `/api/admin/produtos/${v.id}` : '/api/admin/produtos', {
        method: v.id ? 'PATCH' : 'POST',
        body: JSON.stringify(v.dados),
      }),
    onSuccess: () => invalidarCatalogo(queryClient),
  });
}

/** Desativa. O servidor não apaga: pedidos antigos apontam para o produto. */
export function useDesativarProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: true }>(`/api/admin/produtos/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidarCatalogo(queryClient),
  });
}

export function useBloqueios() {
  return useQuery({
    queryKey: chaves.adminBloqueios,
    queryFn: () => apiFetch<Bloqueio[]>('/api/admin/agenda/bloqueios'),
  });
}

export function useConfigAgenda() {
  return useQuery({
    queryKey: chaves.adminConfigAgenda,
    queryFn: () => apiFetch<{ limitePorDia: number }>('/api/admin/agenda/config'),
  });
}

function invalidarAgenda(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: chaves.adminBloqueios });
  queryClient.invalidateQueries({ queryKey: chaves.adminConfigAgenda });
  // O calendário do cliente é outra consulta sobre a mesma agenda.
  queryClient.invalidateQueries({ queryKey: ['agenda'] });
}

export function useBloquearData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { data: string; motivo?: string }) =>
      apiFetch<{ data: string; motivo: string | null; pedidosNaData: number }>(
        '/api/admin/agenda/bloqueios',
        { method: 'POST', body: JSON.stringify(v) },
      ),
    onSuccess: () => invalidarAgenda(queryClient),
  });
}

export function useDesbloquearData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: string) =>
      apiFetch<{ ok: true }>(`/api/admin/agenda/bloqueios/${data}`, { method: 'DELETE' }),
    onSuccess: () => invalidarAgenda(queryClient),
  });
}

export function useDefinirLimite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (limitePorDia: number) =>
      apiFetch<{ limitePorDia: number }>('/api/admin/agenda/config', {
        method: 'PATCH',
        body: JSON.stringify({ limitePorDia }),
      }),
    onSuccess: () => invalidarAgenda(queryClient),
  });
}
