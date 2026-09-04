import { useQuery } from '@tanstack/react-query';
import type { produtoSchema } from '@divine/shared';
import type { z } from 'zod';
import { apiFetch } from './client';
import { chaves } from './queries';

/**
 * O tipo sai do schema Zod compartilhado, e não de uma cópia escrita à mão: se
 * a API acrescentar ou renomear um campo, o typecheck do app acusa. Uma cópia
 * só divergiria em silêncio.
 */
export type ProdutoApi = z.infer<typeof produtoSchema>;

export function useProdutos() {
  return useQuery({
    queryKey: chaves.produtos,
    queryFn: () => apiFetch<ProdutoApi[]>('/api/produtos'),
  });
}

export function useProduto(id: string) {
  return useQuery({
    queryKey: chaves.produto(id),
    queryFn: () => apiFetch<ProdutoApi>(`/api/produtos/${id}`),
    enabled: Boolean(id),
  });
}
