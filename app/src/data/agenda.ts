import { paraISO } from '@divine/shared';
import type { Agenda } from '@divine/shared';

export type { Agenda };


function daquiADias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

export const agendaInicial: Agenda = {
  datasBloqueadas: [daquiADias(6), daquiADias(7), daquiADias(13)],
  limitePorDia: 5,
};
