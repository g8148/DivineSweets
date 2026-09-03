import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { Cabecalho } from '@/components/Cabecalho';
import { CardPedido } from '@/components/CardPedido';
import { Chip } from '@/components/Chip';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { diaDaSemana, formatarData } from '@/data/format';
import { useAuth } from '@/state/AuthContext';
import { usePedidos } from '@/state/PedidosContext';
import { cores, espaco } from '@/theme';
import type { Pedido, StatusPedido } from '@/types';

const FILTROS: { id: StatusPedido | 'todos'; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'recebido', rotulo: 'Recebidos' },
  { id: 'producao', rotulo: 'Em produção' },
  { id: 'pronto', rotulo: 'Prontos' },
  { id: 'entregue', rotulo: 'Entregues' },
];

export default function PainelPedidos() {
  const { pedidos } = usePedidos();
  const { sair } = useAuth();
  const [filtro, setFiltro] = useState<StatusPedido | 'todos'>('todos');

  function sairDaConta() {
    sair();
    router.replace('/(auth)/login');
  }

  const ativos = pedidos.filter((p) => p.status !== 'entregue' && p.status !== 'recusado').length;

  const secoes = useMemo(() => {
    const visiveis = pedidos.filter((p) => filtro === 'todos' || p.status === filtro);
    const porData = visiveis.reduce<Record<string, Pedido[]>>((acc, p) => {
      (acc[p.entrega.data] ??= []).push(p);
      return acc;
    }, {});

    return Object.keys(porData)
      .sort()
      .map((data) => ({ title: data, data: porData[data] }));
  }, [pedidos, filtro]);

  return (
    <View style={styles.tela}>
      <Cabecalho
        titulo="Painel de Pedidos"
        subtitulo={`${ativos} pedidos ativos`}
        acao={
          <Pressable onPress={sairDaConta} hitSlop={8}>
            <Texto variante="legenda" peso="semibold" cor={cores.branco}>
              Sair
            </Texto>
          </Pressable>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosScroll}
        contentContainerStyle={styles.filtros}
      >
        {FILTROS.map((f) => (
          <Chip key={f.id} rotulo={f.rotulo} selecionado={filtro === f.id} onPress={() => setFiltro(f.id)} />
        ))}
      </ScrollView>

      <SectionList
        sections={secoes}
        keyExtractor={(pedido) => pedido.id}
        contentContainerStyle={styles.lista}
        renderSectionHeader={({ section }) => (
          <Texto peso="semibold" style={styles.secao}>
            {formatarData(section.title)} — {diaDaSemana(section.title)}
          </Texto>
        )}
        renderItem={({ item }) => (
          <CardPedido
            pedido={item}
            mostrarCliente
            onPress={() => router.push(`/(admin)/pedido/${item.id}`)}
          />
        )}
        ListEmptyComponent={<Vazio mensagem="Nenhum pedido neste filtro." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  filtrosScroll: { flexGrow: 0, flexShrink: 0 },
  filtros: { gap: espaco.sm, padding: espaco.md, alignItems: 'center' },
  lista: { padding: espaco.md, paddingTop: 0, gap: espaco.md },
  secao: {
    backgroundColor: cores.rosaClaro,
    paddingVertical: espaco.sm,
    paddingHorizontal: espaco.md,
    marginHorizontal: -espaco.md,
  },
});
