import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  useBloquearData,
  useBloqueios,
  useConfigAgenda,
  useDefinirLimite,
  useDesbloquearData,
} from '@/api/admin';
import { useDisponibilidade } from '@/api/agenda';
import { Cabecalho } from '@/components/Cabecalho';
import { Calendario, type Marcacao } from '@/components/Calendario';
import { Cartao } from '@/components/Cartao';
import { SeletorQuantidade } from '@/components/SeletorQuantidade';
import { Texto } from '@/components/Texto';
import { formatarData, paraISO } from '@divine/shared';
import { cores, espaco } from '@/theme';

function mesDeHoje() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

export default function AgendaAdmin() {
  const [mes, setMes] = useState(mesDeHoje);

  const bloqueios = useBloqueios();
  const config = useConfigAgenda();
  // O mesmo endpoint que alimenta o calendário do cliente: a lotação é contada
  // no servidor, e reproduzi-la aqui abriria espaço para as duas telas
  // discordarem sobre qual dia está cheio.
  const disponibilidade = useDisponibilidade(mes);

  const bloquear = useBloquearData();
  const desbloquear = useDesbloquearData();
  const definirLimite = useDefinirLimite();

  const hojeISO = paraISO(new Date());

  const datasBloqueadas = useMemo(
    () => new Set((bloqueios.data ?? []).map((b) => b.data)),
    [bloqueios.data],
  );

  const motivoPorData = useMemo(
    () => new Map((disponibilidade.data?.dias ?? []).map((d) => [d.data, d.motivo])),
    [disponibilidade.data],
  );

  const marcarDia = useCallback(
    (iso: string): Marcacao => {
      if (datasBloqueadas.has(iso)) return 'bloqueada';
      return motivoPorData.get(iso) === 'lotada' ? 'lotada' : null;
    },
    [datasBloqueadas, motivoPorData],
  );

  async function alternarBloqueio(iso: string) {
    if (datasBloqueadas.has(iso)) {
      desbloquear.mutate(iso);
      return;
    }

    const { pedidosNaData } = await bloquear.mutateAsync({ data: iso });
    // Bloquear não desmarca o que já foi aceito. Sem este aviso, a confeiteira
    // fecharia o dia sem saber que há encomendas esperando nele.
    if (pedidosNaData > 0) {
      Alert.alert(
        'Data bloqueada',
        `${formatarData(iso)} já tem ${pedidosNaData} ${
          pedidosNaData === 1 ? 'pedido aceito' : 'pedidos aceitos'
        }. O bloqueio impede novas encomendas, mas não cancela esses — trate um a um no painel.`,
      );
    }
  }

  const bloqueadas = [...datasBloqueadas].sort();

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Agenda" subtitulo="disponibilidade de produção" />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Limite de pedidos por dia</Texto>
          {config.isPending ? (
            <ActivityIndicator color={cores.vinho} style={styles.carregandoLinha} />
          ) : (
            <SeletorQuantidade
              valor={config.data?.limitePorDia ?? 5}
              aoMudar={(n) => definirLimite.mutate(n)}
              min={1}
              max={20}
            />
          )}
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
            // Aqui o passado é a única coisa intocável: a confeiteira precisa
            // poder bloquear um dia lotado, que para o cliente já é indisponível.
            avaliarDia={(iso) => (iso < hojeISO ? 'passado' : null)}
            marcarDia={marcarDia}
            aoMudarMes={setMes}
            mostrarLegenda={false}
          />

          {disponibilidade.isFetching || bloqueios.isFetching ? (
            <ActivityIndicator color={cores.vinho} style={styles.carregandoLinha} />
          ) : null}

          <View style={styles.legenda}>
            <Marcador cor={cores.branco} borda rotulo="Livre" />
            <Marcador cor={cores.alerta} rotulo="Bloqueada" />
            <Marcador cor="#fde8cd" rotulo="Lotada" />
          </View>
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Datas bloqueadas</Texto>

          {bloqueios.isPending ? (
            <ActivityIndicator color={cores.vinho} style={styles.carregandoLinha} />
          ) : bloqueadas.length === 0 ? (
            <Texto variante="legenda" cor={cores.cinzaEscuro} style={styles.vazio}>
              Nenhuma data bloqueada.
            </Texto>
          ) : (
            bloqueadas.map((iso) => (
              <View key={iso} style={styles.linhaData}>
                <Texto>{formatarData(iso)}</Texto>
                <Pressable onPress={() => desbloquear.mutate(iso)} hitSlop={8}>
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
  carregandoLinha: { alignSelf: 'flex-start', paddingVertical: espaco.sm },
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
