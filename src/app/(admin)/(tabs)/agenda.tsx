import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Cabecalho } from '@/components/Cabecalho';
import { Calendario, type Marcacao } from '@/components/Calendario';
import { Cartao } from '@/components/Cartao';
import { SeletorQuantidade } from '@/components/SeletorQuantidade';
import { Texto } from '@/components/Texto';
import { formatarData, paraISO } from '@/data/format';
import { usePedidos } from '@/state/PedidosContext';
import { cores, espaco } from '@/theme';

export default function AgendaAdmin() {
  const { agenda, ocupacao, bloquearData, desbloquearData, definirLimite } = usePedidos();

  const hojeISO = paraISO(new Date());

  function ehPassado(iso: string): boolean {
    return iso < hojeISO;
  }

  function marcarDia(iso: string): Marcacao {
    if (agenda.datasBloqueadas.includes(iso)) return 'bloqueada';
    if ((ocupacao[iso] ?? 0) >= agenda.limitePorDia) return 'lotada';
    return null;
  }

  function alternarBloqueio(iso: string) {
    if (agenda.datasBloqueadas.includes(iso)) {
      desbloquearData(iso);
    } else {
      bloquearData(iso);
    }
  }

  const bloqueadas = [...agenda.datasBloqueadas].sort();

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Agenda" subtitulo="disponibilidade de produção" />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Limite de pedidos por dia</Texto>
          <SeletorQuantidade valor={agenda.limitePorDia} aoMudar={definirLimite} min={1} max={20} />
          <Texto variante="legenda" cor={cores.cinzaEscuro}>
            Dias que atingirem esse limite deixam de aceitar novas encomendas.
          </Texto>
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Bloquear datas</Texto>
          <Texto variante="legenda" cor={cores.cinzaEscuro}>
            Toque num dia para bloquear ou liberar.
          </Texto>

          <Calendario
            dataSelecionada=""
            aoSelecionar={alternarBloqueio}
            avaliarDia={(iso) => (ehPassado(iso) ? 'passado' : null)}
            marcarDia={marcarDia}
            mostrarLegenda={false}
          />

          <View style={styles.legenda}>
            <Marcador cor={cores.branco} borda rotulo="Livre" />
            <Marcador cor={cores.alerta} rotulo="Bloqueada" />
            <Marcador cor="#fde8cd" rotulo="Lotada" />
          </View>
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Datas bloqueadas</Texto>

          {bloqueadas.length === 0 ? (
            <Texto variante="legenda" cor={cores.cinzaEscuro} style={styles.vazio}>
              Nenhuma data bloqueada.
            </Texto>
          ) : (
            bloqueadas.map((iso) => (
              <View key={iso} style={styles.linhaData}>
                <Texto>{formatarData(iso)}</Texto>
                <Pressable onPress={() => desbloquearData(iso)} hitSlop={8}>
                  <Texto variante="legenda" peso="semibold" cor={cores.vinhoClaro}>
                    Desbloquear
                  </Texto>
                </Pressable>
              </View>
            ))
          )}
        </Cartao>
      </ScrollView>
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
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, gap: espaco.md, paddingBottom: espaco.xxl },
  cartao: { padding: espaco.md, gap: espaco.sm },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.md, justifyContent: 'center' },
  marcador: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  bolinha: { width: 12, height: 12, borderRadius: 6 },
  linhaData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: espaco.sm,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  vazio: { paddingVertical: espaco.sm },
});
