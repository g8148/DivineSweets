import { useQuery } from '@tanstack/react-query';
import type { diaDisponibilidadeSchema, disponibilidadeSchema } from '@divine/shared';
import type { z } from 'zod';
import { apiFetch } from './client';
import { chaves } from './queries';

export type DiaDisponibilidade = z.infer<typeof diaDisponibilidadeSchema>;
export type Disponibilidade = z.infer<typeof disponibilidadeSchema>;

/** `mes` no formato AAAA-MM. */
export function useDisponibilidade(mes: string) {
  return useQuery({
    queryKey: chaves.agenda(mes),
    queryFn: () => apiFetch<Disponibilidade>(`/api/agenda/disponibilidade?mes=${mes}`),
    // A agenda muda quando outros clientes fazem pedidos, e não só quando este
    // faz: cache curto, e não os 5 minutos que servem ao catálogo.
    staleTime: 30 * 1000,
  });
}
