import { paraISO } from '@/data/format';

export type Agenda = {
  datasBloqueadas: string[];
  limitePorDia: number;
};

function daquiADias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

export const agendaInicial: Agenda = {
  datasBloqueadas: [daquiADias(6), daquiADias(7), daquiADias(13)],
  limitePorDia: 5,
};
