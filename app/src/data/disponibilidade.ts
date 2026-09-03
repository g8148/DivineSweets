import type { Agenda } from '@/data/agenda';

export const ANTECEDENCIA_MINIMA_HORAS = 48;

export type MotivoIndisponivel = 'passado' | 'antecedencia' | 'bloqueada' | 'lotada' | null;

function inicioDoDia(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
}

export function motivoIndisponivel(
  dataISO: string,
  agenda: Agenda,
  ocupacao: Record<string, number>,
  agora: Date,
): MotivoIndisponivel {
  const alvo = inicioDoDia(dataISO);
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  if (alvo < hoje) return 'passado';

  // A antecedência é medida do início de hoje até o início do dia escolhido, não
  // da hora atual: um dia inteiro está disponível ou não, e essa resposta não pode
  // mudar conforme as horas passam. Com 48h, o primeiro dia livre é sempre D+2.
  const horasDeDiferenca = (alvo.getTime() - hoje.getTime()) / 36e5;
  if (horasDeDiferenca < ANTECEDENCIA_MINIMA_HORAS) return 'antecedencia';

  if (agenda.datasBloqueadas.includes(dataISO)) return 'bloqueada';

  if ((ocupacao[dataISO] ?? 0) >= agenda.limitePorDia) return 'lotada';

  return null;
}

export function dataDisponivel(
  dataISO: string,
  agenda: Agenda,
  ocupacao: Record<string, number>,
  agora: Date,
): boolean {
  return motivoIndisponivel(dataISO, agenda, ocupacao, agora) === null;
}

export function contarOcupacao(
  pedidos: { entrega: { data: string }; status: string }[],
): Record<string, number> {
  return pedidos.reduce<Record<string, number>>((acc, pedido) => {
    if (pedido.status === 'recusado') return acc;
    acc[pedido.entrega.data] = (acc[pedido.entrega.data] ?? 0) + 1;
    return acc;
  }, {});
}
