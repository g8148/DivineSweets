import { QueryClient } from '@tanstack/react-query';

/**
 * As chaves de cache em um lugar só. Invalidação erra em silêncio: uma chave
 * escrita com nome diferente do da consulta não dá erro, apenas não atualiza a
 * tela — e o bug aparece como "o status não mudou depois que eu mudei".
 *
 * Os prefixos são hierárquicos de propósito: invalidar `['pedidos']` alcança a
 * lista e cada detalhe.
 */
export const chaves = {
  produtos: ['produtos'] as const,
  produto: (id: string) => ['produtos', id] as const,
  agenda: (mes: string) => ['agenda', mes] as const,
  meusPedidos: ['pedidos', 'meus'] as const,
  pedido: (id: string) => ['pedidos', id] as const,
  adminPedidos: (status?: string) => ['admin', 'pedidos', status ?? 'todos'] as const,
  adminProdutos: ['admin', 'produtos'] as const,
  adminBloqueios: ['admin', 'bloqueios'] as const,
  adminConfigAgenda: ['admin', 'agenda-config'] as const,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // O catálogo muda raramente; revalidar a cada foco só gastaria rede do
      // cliente. O que muda sozinho — agenda e pedidos — reduz este tempo na
      // própria consulta.
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});
