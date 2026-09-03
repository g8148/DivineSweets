import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Texto } from '@/components/Texto';
import { ChevronLeft, ChevronRight } from '@/components/icones';
import { paraISO } from '@divine/shared';
import type { MotivoIndisponivel } from '@divine/shared';
import { cores, espaco, raio } from '@/theme';

export type Marcacao = 'bloqueada' | 'lotada' | null;

type Props = {
  dataSelecionada: string;
  aoSelecionar: (iso: string) => void;
  avaliarDia: (iso: string) => MotivoIndisponivel;
  /** Pintura extra, usada pela agenda do admin. Ausente, nada muda. */
  marcarDia?: (iso: string) => Marcacao;
  mesInicial?: Date;
  /** A agenda do admin tem a sua própria legenda, com outros estados. */
  mostrarLegenda?: boolean;
};

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const INICIAIS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function primeiroDoMes(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function Calendario({
  dataSelecionada,
  aoSelecionar,
  avaliarDia,
  marcarDia,
  mesInicial,
  mostrarLegenda = true,
}: Props) {
  const [mesVisivel, setMesVisivel] = useState(() => primeiroDoMes(mesInicial ?? new Date()));

  const mesCorrente = primeiroDoMes(new Date());
  const noMesCorrente = mesVisivel.getTime() <= mesCorrente.getTime();

  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();
  const offset = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  const celulas: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  function mudarMes(passo: number) {
    setMesVisivel((atual) => new Date(atual.getFullYear(), atual.getMonth() + passo, 1));
  }

  return (
    <View>
      <View style={styles.barra}>
        <Pressable onPress={() => mudarMes(-1)} disabled={noMesCorrente} hitSlop={8}>
          <ChevronLeft size={22} color={noMesCorrente ? cores.cinza : cores.vinho} strokeWidth={2} />
        </Pressable>

        <Texto peso="semibold">
          {MESES[mes]} de {ano}
        </Texto>

        <Pressable onPress={() => mudarMes(1)} hitSlop={8}>
          <ChevronRight size={22} color={cores.vinho} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.linha}>
        {INICIAIS.map((inicial, i) => (
          <Texto key={i} variante="legenda" cor={cores.cinzaEscuro} style={styles.inicial}>
            {inicial}
          </Texto>
        ))}
      </View>

      <View style={styles.grade}>
        {celulas.map((dia, indice) => {
          if (dia === null) return <View key={`vazio-${indice}`} style={styles.celula} />;

          const iso = paraISO(new Date(ano, mes, dia));
          const motivo = avaliarDia(iso);
          const marcacao = marcarDia?.(iso) ?? null;
          const selecionado = iso === dataSelecionada;

          let fundo: string = cores.branco;
          let corTexto: string = cores.vinho;

          if (marcacao === 'bloqueada') {
            fundo = cores.alerta;
            corTexto = cores.alertaTexto;
          } else if (marcacao === 'lotada') {
            fundo = '#fde8cd';
            corTexto = '#8a5a12';
          } else if (motivo) {
            fundo = cores.rosaClaro;
            corTexto = cores.cinza;
          }

          if (selecionado) {
            fundo = cores.vinho;
            corTexto = cores.branco;
          }

          return (
            <View key={iso} style={styles.celula}>
              <Pressable
                onPress={() => aoSelecionar(iso)}
                disabled={motivo !== null}
                style={[styles.dia, { backgroundColor: fundo }]}
              >
                <Texto peso={selecionado ? 'bold' : 'regular'} cor={corTexto}>
                  {dia}
                </Texto>
              </Pressable>
            </View>
          );
        })}
      </View>

      {mostrarLegenda && (
        <View style={styles.legenda}>
          <Marcador cor={cores.branco} borda rotulo="Disponível" />
          <Marcador cor={cores.rosaClaro} rotulo="Indisponível" />
          <Marcador cor={cores.vinho} rotulo="Selecionado" />
        </View>
      )}
    </View>
  );
}

function Marcador({ cor, rotulo, borda = false }: { cor: string; rotulo: string; borda?: boolean }) {
  return (
    <View style={styles.marcador}>
      <View
        style={[
          styles.bolinha,
          { backgroundColor: cor, borderWidth: borda ? 1 : 0, borderColor: cores.borda },
        ]}
      />
      <Texto variante="legenda" cor={cores.cinzaEscuro}>
        {rotulo}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: espaco.sm,
  },
  linha: { flexDirection: 'row' },
  inicial: { flex: 1, textAlign: 'center', paddingVertical: espaco.xs },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  // A calha de 3px é o que impede os dias indisponíveis de virarem um borrão só.
  celula: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  dia: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: raio.sm },
  legenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.md,
    justifyContent: 'center',
    paddingTop: espaco.md,
  },
  marcador: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  bolinha: { width: 12, height: 12, borderRadius: 6 },
});
